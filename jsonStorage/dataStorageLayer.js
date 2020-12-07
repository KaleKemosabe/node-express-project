'use strict';

const path = require('path');
const fs=require('fs').promises;

const storageConfig=require('./storageConfig.json');
const storageFile = path.join(__dirname, storageConfig.storageFile);

//wrapper function --> createDataStorage
function createDataStorage(){
    const {CODES,MESSAGES}=require(path.join(__dirname,storageConfig.errorCodes));

//private API - async await
    async function readStorage(){
        try{
            const data = await fs.readFile(storageFile,'utf8');
            return JSON.parse(data);
        }
        catch(err) {
            return [];
        }
    }

    async function writeStorage(data){
        try{
            await fs.writeFile(storageFile, JSON.stringify(data, null,4),{encoding:'utf8', flag:'w'});
            return MESSAGES.WRITE_OK();

        }
        catch(err) {
            return MESSAGES.WRITE_ERROR(err.message);
        }
    }

    async function getFromStorage(id) {
        return (await readStorage()).find(watchman =>watchman.watchmanId==id) || null;
    }

    async function addToStorage(newWatchman){
        const storage = await readStorage();
        if(storage.find(watchman=>watchman.watchmanId == newWatchman.watchmanId)) {
            return false;
        }
        else {
            storage.push({
                watchmanId: +newWatchman.watchmanId,
                name: newWatchman.name,
                yearOfBirth:newWatchman.yearOfBirth,
                gear: newWatchman.gear,
                superproperty: newWatchman.superproperty
            });
            await writeStorage(storage);
            return true;
            }
        }

    async function removeFromStorage(id){
        let storage = await readStorage();
        const i = storage.findIndex(watchman=>watchman.watchmanId==id);
        if(i<0) return false;
        storage.splice(i,1);
        await writeStorage(storage);
        return true;
    }

    async function updateStorage(watchman){
        let storage = await readStorage();
        const oldWatchman = 
            storage.find(oldWat => oldWat.watchmanId == watchman.watchmanId);
        if(oldWatchman) {
            Object.assign(oldWatchman, {
               watchmanId: +watchman.watchmanId,
               name: watchman.name,
               yearOfBirth: watchman.yearOfBirth,
               gear: watchman.gear,
               superproperty: watchman.superproperty 
            });
            await writeStorage(storage);
            return true;
        }
        else {
            return false;
        }
    }
// get, insert, update, remove - Datastorage class //////////////
    class Datastorage{
        get CODES() {
            return CODES;
        }

        getAll() {
            return readStorage();
        }

        get(id){
            return new Promise(async (resolve,reject) =>{
                if(!id) {
                    reject(MESSAGES.NOT_FOUND('<empty id>'));
                }
                else {
                    const result = await getFromStorage(id);
                    if(result) {
                        resolve(result);
                    }
                    else{
                        reject(MESSAGES.NOT_FOUND(id));
                    }
                }
            });
        }
        insert(watchman){
            return new Promise(async (resolve,reject)=>{
                if(!(watchman && watchman.watchmanId &&
                     watchman.name && watchman.yearOfBirth)){
                         reject(MESSAGES.NOT_INSERTED());
                }
                else{
                    if( await addToStorage(watchman)) {
                        resolve(MESSAGES.INSERT_OK(watchman.watchmanId));
                    }
                    else {
                        reject(MESSAGES.ALREADY_IN_USE(watchman.watchmanId));
                    }
                }
            });
        }

        remove(watchmanId){
            return new Promise(async (resolve, reject)=>{
                if(!watchmanId) {
                    reject(MESSAGES.NOT_FOUND('<empty>'));
                }
                else {
                    if(await removeFromStorage(watchmanId)) {
                        resolve(MESSAGES.REMOVE_OK(watchmanId));
                    }
                    else {
                        reject(MESSAGES.NOT_REMOVED());
                    }
                }
            });
        }

        update(watchman) {
            return new Promise( async (resolve, reject)=>{
                if(!(watchman && watchman.watchmanId &&
                     watchman.name && watchman.yearOfBirth)){
                         reject(MESSAGES.NOT_UPDATED());
                }
                else {
                    if(await updateStorage(watchman)){
                        resolve(MESSAGES.UPDATE_OK(watchman.watchmanId));
                    }
                    else {
                        reject(MESSAGES.NOT_UPDATED());
                    }
                }
            });
        }

    } 
// class end
    return new Datastorage();
} //wrapper end

module.exports = {
    createDataStorage
}