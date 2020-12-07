'use strict';

const http = require('http');
const path = require('path');

const express = require('express');
const app = express();

const {port,host,storage} = require('./serverConfig.json');

const {createDataStorage} = require(path.join( __dirname,
                                                storage.storageFolder,
                                                storage.dataLayer));

const dataStorage = createDataStorage();   

const server = http.createServer(app);
// ejs template engine - express loads module internally after setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'pageviews'));

app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'public')));

const menuPath=path.join(__dirname,'menu.html');

app.get('/', (req,res)=>res.sendFile(menuPath));
//////////////////////// get all superheroes //////////////////////
app.get('/all', (req,res)=>
    dataStorage.getAll()
        .then(data => 
            res.render('allPersons',{result:data.map(wat=>createPerson(wat))}))
);
//////////////////////// fetch data --> hero with id //////////////
app.get('/getHero', (req,res)=>
    res.render('getHero', {
        title:'Find your hero',
        header:'Find your hero',
        action: '/getHero'
    })
);
///////////////// submit data //////////////
app.post('/getHero', (req,res)=>{
    if(!req.body) res.sendStatus(500);
    
    const heroId = req.body.heroId;
    dataStorage.get(heroId)
        .then(watchman=>
            res.render('personPage',{result:createPerson(watchman)}))
        .catch(error=>sendErrorPage(res,error));
});
//////////////////////// add new superhero //////////////////////
app.get('/inputform', (req,res)=>
    res.render('form',{
        title:'Add new hero',
        header:'Add new hero',
        action:'/insert',
        heroId:{value:'', readonly:''},
        name:{value:'', readonly:''},
        yearOfBirth:{value:'', readonly:''},
        gear:{value:'', readonly:''},
        superproperty:{value:'', readonly:''}
    })
);

app.post('/insert', (req,res)=>{
    if(!req.body) res.sendStatus(500);

    dataStorage.insert(createWatchman(req.body))
        .then(status=> sendStatusPage(res,status))
        .catch(error => sendErrorPage(res,error));
});
//////////////////////// modify superhero //////////////////////
// for user: fill in id and submit --> other fields active
app.get('/updateform', (req,res)=>
    res.render('form',{
        title:'Update hero',
        header:'Update hero',
        action:'/updatedata',
        heroId:{value:'', readonly:''},
        name:{value:'', readonly:'readonly'},
        yearOfBirth:{value:'', readonly:'readonly'},
        gear:{value:'',readonly:'readonly'},
        superproperty:{value:'', readonly:'readonly'}
    })
);
// fill in other fields for update
app.post('/updatedata', (req,res)=>{
    if (!req.body) res.sendStatus(500);
    dataStorage.get(req.body.heroId)
        .then(watchman =>createPerson(watchman))
        .then(person => res.render('form', {
                title:'Update hero',
                header:'Update hero',
                action:'/updateperson',
                heroId:{value:person.heroId, readonly:'readonly'},
                name:{value:person.name, readonly:''},
                yearOfBirth:{value:person.yearOfBirth, readonly:''},
                gear:{value:person.gear, readonly:''},
                superproperty:{value:person.superproperty, readonly:''}
            }))
        .catch(error=>sendErrorPage(res,error));
});
// update hero details
app.post('/updateperson',(req,res)=>{
    if(!req.body) res.sendStatus(500);
    else dataStorage.update(createWatchman(req.body))
        .then(status=>sendStatusPage(res,status))
        .catch(error=>sendErrorPage(res,error));
});
//////////////////////// remove superhero //////////////////////
// get hero by id and delete from the list
app.get('/removeperson', (req,res)=>
    res.render('getHero',{
        title:'Remove hero',
        header:'Remove hero',
        action:'/removeperson'
    })
);

app.post('/removeperson', (req,res)=>{
    if(!req.body) res.sendStatus(500);
    const heroId=req.body.heroId;
    dataStorage.remove(heroId)
        .then(status=>sendStatusPage(res,status))
        .catch(error=>sendErrorPage(res,error));
});

server.listen(port, host, 
    ()=>console.log(`Server ${host}:${port} running`));

function sendErrorPage(res,error, title='Error', header='Error') {
    sendStatusPage(res, error, title, header);
}

function sendStatusPage(res, status, title='This is it.', header='This is it.'){
    return res.render('statusPage', {title,header,status});
}

//from watchman to person
function createPerson(watchman){
    return {
        heroId: watchman.watchmanId,
        name: watchman.name,
        yearOfBirth: watchman.yearOfBirth,
        gear: watchman.gear,
        superproperty: watchman.superproperty
    }
}
// from person to watchman
function createWatchman(person) {
    return {
        watchmanId: person.heroId,
        name: person.name,
        yearOfBirth: person.yearOfBirth,
        gear: person.gear,
        superproperty: person.superproperty
    }
}