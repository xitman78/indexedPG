// let proOne = new Promise( (resolve, reject) => {
//   console.log('In promise');
//   resolve(1);
//   // reject(1);
// });
//
// proOne.then(r => {
//   console.log('Promise returned ', r);
//   return 2;
// })
// .then(r => {
//   console.log('Second then', r);
//   return 3;
// })
// .then(r => {
//   console.log('Third then ', r);
// })
// .catch(e => {
//   console.log('Promise rejected', e);
//   return -1;
// })
// .catch(e => {
//   console.log('Second catch', e);
//   return -2;
// });

class dbCtrl {
  constructor() {
    this.db = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      try {
        let req = window.indexedDB.open('myfirst.db', 4);

        req.onsuccess = event => {
          console.log('onsuccess', event);
          this.db = event.target.result;
          resolve(true);
        };

        req.onerror = event => {
          console.error('IndexedDB error', event);
          reject('IndexedDB error');
        };

        req.onupgradeneeded = event => {
          console.log('onupgradeneeded', event);
          this.db = event.target.result;
          let tblReq = this.db.createObjectStore('Barge2', {keyPath: 'id', autoIncrement: true});
          tblReq.createIndex('name','name', {unique: false});
          console.log('tblReq', tblReq);
          resolve(true);
        }
      }
      catch(e) {
        console.error('Exception', e);
        reject('IndexedDB error');
      }
    });
  }

  insertBarge(barge) {
    return new Promise((resolve, reject) => {
      let trans = this.db.transaction(['Barge2'], 'readwrite');
      let os = trans.objectStore('Barge2');
      let req = os.add(barge);
      req.onsuccess = event => {
        console.log('Success', event.target.result);
        resolve(event.target.result);
      };
      req.onerror = event => {
        console.log('Error', event);
        reject(event);
      };
    });
  }

  fetchAll() {
    return new Promise((resolve, reject) => {
      let result = [];
      let trans = this.db.transaction(['Barge2'], 'readonly');
      let os = trans.objectStore('Barge2');
      let req = os.openCursor(null, 'prev');

      req.onsuccess = event => {
        let cursor = event.target.result;
        if(cursor) {
          result.push(cursor.value);
          cursor.continue();
        }
        else resolve(result);
      };

      req.onerror = event => {
        reject(event);
      };

    });
  }

}

class viewCtrl {

  constructor(db) {
      this.db = db;
      this.bargeNameInput = document.getElementById('bargeNameId');
      this.container = document.getElementById('container');
      this.getAll();
      this.focus();
  }

  submitForm(e) {
    e.preventDefault();
    let name = this.bargeNameInput.value;
    console.log(`Name is ${name}`);
    this.bargeNameInput.value = '';

    this.db.insertBarge({ name }).then(r => {
      this.getAll();
    });

  }

  focus() {
    this.bargeNameInput.focus();
  }

  getAll() {
    this.db.fetchAll().then( r => {
      console.log('All records', r);
      let text = r.reduce((p,c) => {
        return p + '\n' + c.name;
      },'');
      this.container.innerHTML = text;
    })
    .catch(e => {
      console.log('Fetch All Error', e);
    });
  }

}

var ctrl = null;

document.addEventListener("DOMContentLoaded", event => {
  //do work
   let db = new dbCtrl();
   db.init().then(r => {
     ctrl = new viewCtrl(db);
   })
   .catch(e => {
     alert('Cannot init IndexedDB! Update your browser or use another one.');
   });
});
