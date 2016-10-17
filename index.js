
class dbCtrl {
  constructor() {
    this.db = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      try {
        let req = window.indexedDB.open('myfirst.db', 4);

        req.onsuccess = event => {
          // console.log('onsuccess', event);
          this.db = event.target.result;
          resolve(true);
        };

        req.onerror = event => {
          console.error('IndexedDB error', event);
          reject('IndexedDB error');
        };

        req.onupgradeneeded = event => {
          // console.log('onupgradeneeded', event);
          this.db = event.target.result;
          let tblReq = this.db.createObjectStore('Barge2', {keyPath: 'id', autoIncrement: true});
          tblReq.createIndex('name','name', {unique: false});
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
        // console.log('Success', event.target.result);
        resolve(event.target.result);
      };
      req.onerror = event => {
        console.log('Error', event);
        reject(event);
      };
    });
  }

  removeBarge(bargeId) {
    return new Promise((resolve, reject) => {
      let trans = this.db.transaction(['Barge2'], 'readwrite');
      let os = trans.objectStore('Barge2');
      let req = os.delete(bargeId);
      req.onsuccess = event => {
        console.log('Success removing record', event.target.result);
        resolve(event.target.result);
      };
      req.onerror = event => {
        console.log('Error removing record', event);
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
      // console.log('All records', r);
      let text = r.reduce((p,c) => {
        return p + '\n' + c.name;
      },'');
      this.container.innerHTML = text;
    })
    .catch(e => {
      console.log('Fetch All Error', e);
    });
  }

  removeBarge() {
    this.db.removeBarge(1).then(r => {
      console.log('Barge was removed successfully');
    })
  .catch(e => {
    console.log('Error removing barge');
    });
  }

  getJson() {
    /*let headers = new Headers();
    headers.set('Content-Type', 'application/json');*/
    let myRequest = new Request('barges.json', { /*headers,*/ method: 'GET', mode: 'cors', cache: 'no-cache' });

    fetch(myRequest)
      .then(r => {
      console.log('Fetch results', r.body);
      return r.json();
    })
    .then(js => {
      console.log('Got JSON', js);
    })
   .catch(e => {
     console.log('Fetch error - ', e);
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
