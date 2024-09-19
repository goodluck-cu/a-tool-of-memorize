const _db = new Promise((resolve, reject) => {
    let db = indexedDB.open('save');
    db.onsuccess = (ev) => {
        resolve(ev.target.result);
    };
    db.onupgradeneeded = function (event) {
        let db = event.target.result;
        db.createObjectStore("CachedFile", { keyPath: "url" });
        db.createObjectStore("Save", { keyPath: "url" });
        db.createObjectStore("AnswerHistory", { autoIncrement: true });
    };
});

function fetch_cached_file(db, url) {
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(['CachedFile']);
        let objectStore = transaction.objectStore('CachedFile');
        let request = objectStore.get(url);
        request.onerror = function (event) {
            reject(event);
        };
        request.onsuccess = (_) => {
            console.log('found cache for ', url);
            if (request.result) {
                resolve(request.result);
            } else {
                resolve(null);
            }
        };
    });
}

function store_cached_file(db, url, last_modified, content) {
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(['CachedFile'], 'readwrite');
        let objectStore = transaction.objectStore('CachedFile');
        let request = objectStore.put({
            url,
            last_modified,
            content,
        });
        request.onerror = function (event) {
            reject(event);
        };
        request.onsuccess = (_) => {
            resolve();
        };
    });
}

function fetch_save_data(db, key) {
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(['Save']);
        let objectStore = transaction.objectStore('Save');
        let request = objectStore.get(key);
        request.onerror = function (event) {
            reject(event);
        };
        request.onsuccess = (_) => {
            if (request.result) {
                resolve(request.result);
            } else {
                resolve(null);
            }
        };
    });
}

function store_save_data(db, obj) {
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(['Save'], 'readwrite');
        let objectStore = transaction.objectStore('Save');
        let request = objectStore.put(obj);
        request.onerror = function (event) {
            reject(event);
        };
        request.onsuccess = (_) => {
            resolve();
        };
    });
}

function append_history(db, obj) {
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(['AnswerHistory'], 'readwrite');
        let objectStore = transaction.objectStore('AnswerHistory');
        let request = objectStore.put(obj);
        request.onerror = function (event) {
            reject(event);
        };
        request.onsuccess = (_) => {
            resolve();
        };
    });
}

async function fetch_quests(url) {
    url = String(new URL(url, window.location.href));
    let db = await _db;
    let cached_f = await fetch_cached_file(db, url);
    let res = await fetch(url);
    let last_modified = res.headers.get("Last-Modified");
    let date = new Date(last_modified);
    let text;
    if (cached_f) {
        if (cached_f.last_modified < date) {
            text = await res.text();
            console.log("update cache url", url);
            await store_cached_file(db, url, date, text);
        } else {
            console.log("use cache url", url);
            text = cached_f.content;
        }
    } else {
        text = await res.text();
        console.log("update cache url", url);
        await store_cached_file(db, url, date, text);
    }
    try {
        res = JSON.parse(text);
    } catch (e) {
        const jsonString = decodeURIComponent(encodeURIComponent(atob(text)));
        res = JSON.parse(jsonString);
        console.log(res.length);
    };
    return { url, quests: res };
}

async function install_main(div, quest_url) {
    let { url, quests } = await fetch_quests(quest_url);
    div.dataset.url = url;
    div.innerHTML = `
        <div id="quest"></div>
        <div id="sels"></div>
        <div class="touch_area">
            <div class="button" id="submit">提交</div>
            <div class="button" id="next">下一题</div>
        </div>
    `;
    var save = await fetch_save_data(await _db, url);
    if (!save) {
        save = { url, current: 0 };
        await store_save_data(await _db, save);
    }
    let id = save.current;
    div.dataset.current_id = toString(id);

    div.querySelector('#next').addEventListener('click', async () => {
        let id = parseInt(div.dataset.current_id) + 1;
        update_quest(div, { id, quest: quests[id] });
        save.current = id;
        await store_save_data(await _db, save);
    });
    div.querySelector('#submit').addEventListener('click', async () => {
        await check_answer(div);
    });

    update_quest(div, { id, quest: quests[id] });
}

async function check_answer(div) {
    let id = parseInt(div.dataset.current_id);
    let selected = [];
    for (let item of div.querySelectorAll('li.selected')) {
        let value = JSON.parse(item.dataset.value);
        selected.push(value);
    }
    if (selected.length === 0) {
        alert("别不选啊");
        return;
    }

    let quest = JSON.parse(div.dataset.current_quest);
    for (let item of div.querySelectorAll('li')) {
        let value = JSON.parse(item.dataset.value);
        if (quest.answer == value || (Array.isArray(quest.answer) && quest.answer.includes(value))) {
            item.classList.add('right');
        } else {
            item.classList.add('wrong');
        }
    }

    let qanswer = quest.answer;
    if (!Array.isArray(qanswer)) {
        qanswer = [qanswer];
    }
    const right = qanswer.length === selected.length && qanswer.every((value, index) => value === selected[index]);
    let check = {
        quest_id: id,
        url: div.dataset.url,
        date: new Date(),
        selected,
        right,
    };
    append_history(await _db, check);
    console.log(check);
}

function update_quest(div, { id, quest }) {
    div.dataset.current_id = id;
    console.log(id, quest);
    let quest_div = div.querySelector('#quest');
    let sels_div = div.querySelector('#sels');
    quest_div.replaceChildren();
    sels_div.replaceChildren();

    div.dataset.current_quest = JSON.stringify(quest);
    let quest_text = id + '. ' + quest.quest;


    let ul = document.createElement('ul')
    sels_div.appendChild(ul);
    let single_answer;
    if (Array.isArray(quest.answer)) {
        single_answer = false;
    } else {
        single_answer = true;
    }
    let click = (event) => {
        if (event.target.classList.contains('selected')) {
            event.target.classList.remove('selected');
            return;
        }
        if (single_answer) {
            for (let item of event.target.parentElement.querySelectorAll('.selected')) {
                item.classList.remove('selected');
            }
        }
        event.target.classList.add('selected');
    }
    if (quest.type === 'select') {
        if (single_answer) {
            quest_div.innerText = quest_text + ' (单选)';
        } else {
            quest_div.innerText = quest_text + ' (多选)';
        }
        for (const k in quest.sels) {
            const v = quest.sels[k];
            let one = document.createElement('li');
            one.innerText = k + ': ' + v
            ul.appendChild(one);
            one.addEventListener('click', click);
            one.dataset.value = JSON.stringify(k);
        }
    } else if (quest.type == 'judge') {
        quest_div.innerText = quest_text + ' (判断)'
        let ok = document.createElement('li');
        ok.innerText = "对"
        let no = document.createElement('li');
        no.innerText = "不对"
        ok.addEventListener('click', click);
        no.addEventListener('click', click);
        ul.appendChild(ok);
        ul.appendChild(no);
        ok.dataset.value = JSON.stringify(true);
        no.dataset.value = JSON.stringify(false);
    } else if (quest.type == 'unknown') {
        quest_div.innerText = quest_text + ' (不知道答案)'
    }
}

function rand_one(quests) {
    return quests[Math.floor(Math.random() * quests.length)]
}


export {
    fetch_quests,
    install_main,
}