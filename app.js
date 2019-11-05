const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const fuzzy = require('fuzzyset.js')

const port = process.env.PORT || 8080;
process.setMaxListeners(Infinity)

function song_search(artist_name){
    song_list = []
    album_list = []
    let click_page = ''
    return new Promise(async (resolve, reject) => {
        try{
            const browser= await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
		    ,ignoreHTTPSErrors: true, dumpio: false 
            })
            const page = await browser.newPage();
            page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36')
		page.on('error', msg => {
        		throw msg ;
      		});
            await page.goto('https://www.google.com');
            await page.waitForSelector("input")
            const searchBar = await page.$('input');
            searchBar.type(artist_name + ' songs');
            await page.waitFor(1000);
            searchBar.press('Enter');
            await page.waitForSelector('h3');
            const info_list = await page.$$('div[class="Z1hOCe"]')
            for (const l of info_list){
                const li = await l.$('span[class="w8qArf"]');
                const name = await li.$eval('a',a=>a.innerText)
                if (name === 'Albums'){
                    const data_span = await l.$('span[class="LrzXr kno-fv"]')
                    const text = await data_span.$$('a')
                    for (t of text){
                        const names = await (await t.getProperty('textContent')).jsonValue()
                        if (names.toLowerCase() !== 'more'){
                            let add = true
                            if (album_list && album_list.length > 0){
                                album_list.forEach(function(element){
                                    a = FuzzySet([element]);
                                    matching = a.get(names)
                                    if (matching !== null && matching[0][0] > .7 ){
                                        add = false
                                    }
                                })
                                if (add){
                                    album_list.push(names)
                                }
                            }else{
                                album_list.push(names)
                            }
                        }
                        else {
                            click_page = t
                        }
                    }
                    
                }
            }
            if (await page.$('div[class="EDblX DAVP1"]') !== null){
                const container = await page.$('div[class="EDblX DAVP1"]');
                const list = await container.$$('div[class="rlc__slider-page"]');
                for (const l of list){
                    other_listing = await l.$$('div[class="h998We mlo-c"]');
                    for(const o of other_listing){
                        song= {}
                        song_name = await o.$eval('div[class="title"]', a => a.innerText);
                        if (await o.$('div[class="jbzYp"]') !== null){
                            song_album = await o.$eval('div[class="jbzYp"]',a => a.innerText);
                            const pattern = new RegExp(/(.*)\·(\s*)?([\d]*)/)
                            let match = ''
                            if (pattern.test(song_album)){
                                match = pattern.exec(song_album)[1].trim()
                            }
                            else{
                                match = song_album.trim()
                            }
                            if (album_list && album_list.length > 0){
                                let add = true
                                album_list.forEach(function(element){
                                    a = FuzzySet([element]);
                                    matching = a.get(match)
                                    if (matching){
                                        if (matching !== null && matching[0][0] > .7){
                                            add = false
                                        }
                                    }
                                })
                                if (add){
                                    album_list.push(match)
                                }
                            }else{
                                album_list.push(match)
                            }
                        }
                        else{
                            song_album = ''
                        }
                        song['name'] = song_name;
                        song['album'] = song_album;
                        song_list.push(song);
                    }

                }
                if (click_page !== ''){
                    await click_page.click()
                    await page.waitForSelector('h3');
                    if (await page.$('div[class="EDblX DAVP1"]') !== null){
                        const album_container = await page.$('div[class="EDblX DAVP1"]');
                        const album_listing = await album_container.$$('div[class="rlc__slider-page"]');
                        for (const album_l of album_listing){
                            other_listing = await album_l.$$('div[class="h998We mlo-c"]');
                            for(const o of other_listing){
                                album = await o.$eval('div[class="title"]', a => a.innerText);
                                if (album_list && album_list.length > 0){
                                    let add = true
                                    album_list.forEach(function(element){
                                        a = FuzzySet([element]);
                                        matching = a.get(album)
                                        if (matching){
                                            if (matching !== null && matching[0][0] > .7){
                                                add = false
                                            }
                                        }
                                    })
                                    if (add){
                                        album_list.push(album);
                                    }
                                }else{
                                    album_list.push(album)
                                }
                            }
                        }
                    }
                }
            song_list.push({'album':album_list})
            }
            else{
                song_list = [];
            }
            browser.close();
            return resolve(song_list);
        }
        catch(e){
            return reject(e)
        }
    })
}

function search_artist_info(artist){
    result = ''
    return new Promise(async (resolve, reject) => {
        try{
            const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
		    ,ignoreHTTPSErrors: true, dumpio: false
            });
            const page = await browser.newPage();
            page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36')
            await page.goto('https://www.google.com');
            await page.waitForSelector("input")
            const searchBar = await page.$('input');
            searchBar.type(artist);
            await page.waitFor(1000);
            searchBar.press('Enter');

            var result = {}
            await page.waitForSelector('h3');
            const table = await page.$('table[class="rhsvw RJuLSb"]');
            const profile = await page.$('div[class="OOijTb"]')
            if (table){
                const lists = await table.$$('tr')
                for (const l of lists){
                    title = await l.$eval('span[class="hl"]', span => span.textContent)
                    link = await l.$eval('a', a => a.href);
                    result[title] = link 
                }
            }
            if (profile){
                const lists = await profile.$$('g-link')
                for (const l of lists){
                    title = await l.$eval('div[class="CtCigf"]', div => div.textContent)
                    link = await l.$eval('a', a => a.href);
                    result[title] = link
                }
            }
        await browser.close();
        return resolve(result);
        }
        catch(e){
           return reject(e);
        } 
    })
}

app.get('/', function(req, res) {
    if (Object.keys(req.query).length === 0){
        res.send('Use artist key')
    }else{
        (async() =>{
            output= {} //will store the output
            Promise.all([song_search(req.query.artist),search_artist_info(req.query.artist)]).then(function(results){
                [output['song'],output['info']] = results;
                res.setHeader('Content-Type', 'text/html');
                res.send(output)
            }).catch(console.error);
        })();
    }
});

function song_album_search(album,artistName){
    album_info = {}
    return new Promise(async (resolve, reject) => {
        try{
            const browser= await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
		    ignoreHTTPSErrors: true, dumpio: false,
                defaultViewport: {
                    width: 1100,
                    height: 600
                }
            })
            const page = await browser.newPage();
            page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36')
            await page.goto('https://www.google.com');
            await page.waitForSelector("input")
            const searchBar = await page.$('input');
            searchBar.type(artistName +' '+ album);
            await page.waitFor(1000);
            searchBar.press('Enter');
            await page.waitForSelector('h3');
            const click_link_div = await page.$('div[class="ErlEM"]')
            if ( click_link_div !== null){
                const link_click = await click_link_div.$('a[class="P7Vl4c"]')
                await link_click.click()
                await page.waitForSelector('h3')
                if (await page.$('div[class="NFQFxe yp1CPe mod"]') !== null){
                    const link_div = await page.$('div[class="NFQFxe yp1CPe mod"]')
                    await link_div.click();
                    await page.waitForSelector('h3');
                }
                if (await page.$('div[class="EDblX DAVP1"]') !== null){
                    const container = await page.$('div[class="EDblX DAVP1"]');
                    const list = await container.$$('div[class="rlc__slider-page"]');
                    let song = []
                    for (const l of list){
                        other_listing = await l.$$('div[class="h998We mlo-c"]');
                        for(const o of other_listing){
                            song_name = await o.$eval('div[class="title"]', a => a.innerText);
                            song.push(song_name)
                        }
                        
                    }
                    album_info['song'] = song
                }
                const table = await page.$('table[class="rhsvw RJuLSb"]');
                if (table !== null){
                    if (table){
                        const lists = await table.$$('tr')
                        let info_list = {}
                        for (const l of lists){
                            title = await l.$eval('span[class="hl"]', span => span.textContent)
                            link = await l.$eval('a', a => a.href);
                            info_list[title] = link
                        }
                        album_info['places'] = info_list
                    }
                }
                const album_info_div = await page.$$('div[class="Z1hOCe"]')
                if (album_info_div !== null){
                    let info = {}
                    for (d of album_info_div){
                        const info_album_title = await d.$eval('span[class="w8qArf"]',s=>s.innerText)
                        const info_album_value = await d.$eval('span[class="LrzXr kno-fv"]',s=>s.innerText)
                        info[info_album_title] = info_album_value
                    }
                    album_info['information'] = info
                }
            }
           await browser.close();
            return resolve(album_info);
        }
        catch(e){
            return reject(e)
        }
    })
}

app.get('/album', function(req, res) {
    if (Object.keys(req.query).length === 0){
        res.send('Use album key and artist')
    }else{
        (async() =>{
            output= {} //will store the output
            song_album_search(req.query.album,req.query.artist).then(function(results){
                output = results;
                res.setHeader('Content-Type', 'text/html');
                res.send(output)
            }).catch(console.error);
        })();
    }
});

var clean_url = function(url){
    url = url.replace(/\/+$/, "");
    return url;
}
var match_regex = function(url){
    regex = /^(http)?s?(:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/;
    return regex.test(url);
}
var sanitize_url = function(url){
    if (match_regex(url)){
        for (const t of url){
            if (t == '.'){
                r = url.indexOf(t);
            }
        }
        var left_Value = url.substr(r);
        if (left_Value == '.com' || left_Value == '.com/'){
            return url;
        }else {
            return ;
        }
    }else{
        return;
    }
  };

function facebook_search(facebook_url){
    var jsonData = {};
    return new Promise(async (resolve, reject) => {
        try{
            var cleaned_url = clean_url(facebook_url);
            if (cleaned_url.indexOf('about')>0){
                var url = cleaned_url
            }else{
                var url = cleaned_url + '/about/'
            }

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
		    ignoreHTTPSErrors: true, dumpio: false
            });
            const page = await browser.newPage();
            page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36')

            await page.goto(url);
            await page.waitForSelector(".img");

            try{
                const infos = await page.$$('div[class="_5aj7 _3-8j"]');
                for (const info of infos){
                    const photo_link = await info.$eval('img', img => img.src);
                    const inner_text = await page.evaluate(info => info.innerText,info);
                    var web_url=null;
                    if (sanitize_url(inner_text)){
                            web_url = sanitize_url(inner_text);
                    }
                    if (photo_link.indexOf('EaDvTjOwxIV') >0 || web_url){
                        jsonData["website"] = inner_text;
                    }
                    else if(photo_link.indexOf('8TRfTVHth97') > 0 || inner_text.indexOf('instagram')>0){
                        jsonData["instagram"] = inner_text;
                    }
                    else if (photo_link.indexOf('WPSrBl8J06p') >0|| inner_text.indexOf('twitter')>0){
                        jsonData["twitter"]=inner_text;
                    }
                    else if (photo_link.indexOf('RTHgMeQuiIN') >0 || photo_link.indexOf('7xu6qkZsbtP') >0 || inner_text.indexOf('youtube')>0){
                        if (match_regex(inner_text)){
                            jsonData["youtube"]=inner_text;
                        }else{
                            continue;
                        }
                    }
                    else if (photo_link.indexOf('PPpFwUhDmz') >0|| inner_text.indexOf('soundlcoud')>0){
                        jsonData["soundcloud]"]= inner_text;
                    }
                }
                await browser.close();
                return resolve(jsonData);
            }
            catch(e){
                return reject(e)
            }
        }
        catch(e){
            return reject(e)
        }
    })
}

app.get('/facebook_scrap', function(req, res) {
    if (Object.keys(req.query).length === 0){
        res.send('Use url key')
    }else{
        (async() =>{
            facebook_search(req.query.url).then(function(result){
                res.setHeader('Content-Type', 'text/html');
                res.send(result);
            }).catch(console.error);
            })();
    }
});

function google_search(search){
    var result = ''
    return new Promise(async (resolve, reject) => {
        try{
            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
		    ,ignoreHTTPSErrors: true, dumpio: false
            });
            const page = await browser.newPage();
            page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36')
            await page.goto('https://www.google.com');
            await page.waitForSelector("input")
            const searchBar = await page.$('input');
            searchBar.type(search);
            await page.waitFor(1000);
            searchBar.press('Enter');
            await page.waitForSelector('h3');
            const table = await page.$('div[class="srg"]');
            if (table){
                const lists = await table.$$('div[class="g"]')
                for (const t of lists){
                    const description = await t.$eval('cite', el => el.textContent.trim())
                    const links = await t.$eval('a', a => a.href)
                    if (description.toLowerCase().indexOf('official') >= 0){
                        result = links;
                        break;
                    }else if (description.toLowerCase().indexOf('public figure') >= 0){
                        result = links;
                        break;
                    }else if (description.toLowerCase().indexOf('performing arts') >= 0){
                        result = links;
                        break;
                    }
                }
            }
            await browser.close();
            return resolve(result);
        }
        catch(e){
            return reject(e)
        }
    })
}

app.get('/facebook', function(req, res) {
    if (Object.keys(req.query).length === 0){
        res.send('Use search key')
    }else{
        (async() =>{
            google_search(req.query.search + " facebook page").then(function(result){
                res.setHeader('Content-Type', 'text/html');
                res.send(result)
            }).catch(console.error);
        })();
    }
});

app.listen(port, function() {
    console.log('App listening on port ' + port)
})
