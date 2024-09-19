const _db = new Promise((resolve, reject) => {
    let db = indexedDB.open('save');
    db.onsuccess = (ev) => {
        resolve(ev.target.result);
    };
    db.onupgradeneeded = function (event) {
        let db = event.target.result;
        db.createObjectStore("CachedFile", { keyPath: "url" });
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
    };
    return res;
}

async function install_main(div, quest_url) {
    let quests = await fetch_quests(quest_url);
    div.innerHTML = `
        <div id="quest"></div>
        <div id="sels"></div>
        <div class="touch_area">
            <div class="button" id="submit">提交</div>
            <div class="button" id="next">下一题</div>
        </div>
    `;

    div.querySelector('#next').addEventListener('click', () => {
        update_quest(div, rand_one(quests));
    });
    div.querySelector('#submit').addEventListener('click', () => {
        check_answer(div);
    });

    update_quest(div, rand_one(quests));
}

function check_answer(div) {
    let quest = JSON.parse(div.dataset.current_quest);
    for (let item of div.querySelectorAll('li')) {
        let value = JSON.parse(item.dataset.value);
        if (quest.answer == value || (Array.isArray(quest.answer) && quest.answer.includes(value))) {
            item.classList.add('right');
        } else {
            item.classList.add('wrong');
        }
    }
}

function update_quest(div, quest) {
    let quest_div = div.querySelector('#quest');
    let sels_div = div.querySelector('#sels');
    quest_div.replaceChildren();
    sels_div.replaceChildren();

    div.dataset.current_quest = JSON.stringify(quest);


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
            quest_div.innerText = quest.quest + ' (单选)';
        } else {
            quest_div.innerText = quest.quest + ' (多选)';
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
        quest_div.innerText = quest.quest + ' (判断)'
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
        quest_div.innerText = quest.quest + ' (不知道答案)'
    }
}

function rand_one(quests) {
    return quests[Math.floor(Math.random() * quests.length)]
}


export {
    fetch_quests,
    install_main,
}