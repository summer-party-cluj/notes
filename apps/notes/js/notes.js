
/**
 * @description Notes Database management
 * @returns
 */
var NotesDb = function () {
  "use strict";
  var myself = this,
    mDb,
    mDbRef,
    mAvailable = false,
    mDbReady = false;
  //NotesDb will be singleton
  if (NotesDb.myInstance) {
    return NotesDb.myInstance;
  }
  NotesDb.myInstance = myself;
  /**
   * @description On request failure
   */
  function onRequestFailure(e) {
    console.log(e);
  }
  /**
   * @description Get all notes
   */
  myself.getAllItems = function(responseCb) {
    var todos,
      trans,
      store,
      keyRange,
      cursorRequest,
      response = [];
    trans = mDbRef.transaction(["note"], IDBTransaction.READ_WRITE);
    store = trans.objectStore("note");

    // Get everything in the store;
    keyRange = IDBKeyRange.lowerBound(0);
    cursorRequest = store.openCursor(keyRange);
    cursorRequest.onsuccess = function(e) {
      var result = e.target.result;
      if (!!result === false) {
        responseCb(response);
        return;
      }
      result.continue();
    };
    cursorRequest.onerror = onRequestFailure;
  };
  /**
   * @description Add new note
   */
  myself.addNote = function(noteText, addNoteCb) {
    var trans,
      store,
      data,
      request;
    trans = mDbRef.transaction(["note"], IDBTransaction.READ_WRITE);
    store = trans.objectStore("note");
    data = {
      "text": noteText,
      "timeStamp": (new Date()).getTime()
    };
    request = store.put(data);
    request.onsuccess = function(e) {
      addNoteCb(true, noteText);
    };
    request.onerror = function(e) {
      addNoteCb(false, noteText);
    };
  };
  /**
   * @description When database open was with success
   */
  function onSuccessOpen(e) {
    var v = "0.0",
      setVersionRequest;
    mDbRef = e.target.result;
    // We can only create Object stores in a setVersion transaction;
    if (v !== mDbRef.version) {
      setVersionRequest = mDbRef.setVersion(v);
      // onsuccess is the only place we can create Object Stores
      setVersionRequest.onerror = onRequestFailure;
      setVersionRequest.onsuccess = function (e) {
        if (mDbRef.objectStoreNames.contains("note")) {
          mDbRef.deleteObjectStore("note");
        }
        var store = mDbRef.createObjectStore("note",
          {keyPath: "timeStamp"});
        mDbReady = true;
      };
    } else {
      mDbReady = true;
    }
  }
  /**
   * @description Initialize
   */
  function init() {
    var request;
    mDb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
    if ('webkitIndexedDB' in window) {
      window.IDBTransaction = window.webkitIDBTransaction;
      window.IDBKeyRange = window.webkitIDBKeyRange;
    }
    if (mDb) {
      mAvailable = true;
      request = mDb.open("NotesApp");
      request.onsuccess = onSuccessOpen;
      request.onfailure = function (e) {
  	    mAvailable = false;
  	    mDbReady = true;
      	onRequestFailure(e);
      };
    }
  }
  myself.getAvailable = function () {
    return mAvailable;
  };
  myself.getDbReady = function () {
	  return mDbReady;
  };
  myself.getNotes = function () {
  };
  init();
};

var NotesApp = function () {
  "use strict";
  var myself = this,
    mDb,
    mDbAvailable = false,
    mNotes = [];
  //NotesApp will be singleton
  if (NotesApp.myInstance) {
    return NotesApp.myInstance;
  }
  NotesApp.myInstance = myself;
  function buildNoteHtml(note) {
    console.log(note);
  }
  function getNotesResponseCb(notes) {
    var notesLength = 0,
      i = 0;
    notesLength = notes.length;
    console.log(notes);
    if (notesLength === 0) {
      addNoteButtonClick();
    } else {
      for (i = 0; i < notesLength; i = i +1) {
        buildNoteHtml(notes[i]);
      }
    }
  }
  function getNotes() {
  	var dbReady = mDb.getDbReady();
  	if (dbReady) {
  	  mDb.getAllItems(getNotesResponseCb);
  	} else {
  	  setTimeout(function () {getNotes(); }, 100);
  	}
  }
  function delegateForNoteRow() {
    
  }
  /**
   * @description Function executed when cancel add note button was clicked
   */
  function cancelInsertNoteClick() {
    document.getElementById("addNoteContainer").style.display = "none";
    document.getElementById("insertNote").style.display = "none";
    document.getElementById("cancelInsertNote").style.display = "none";
  }
  /**
   * @description Function executed when add note button was clicked
   */
  function addNoteButtonClick() {
    document.getElementById("addNoteContainer").style.display = "block";
    document.getElementById("insertNote").style.display = "block";
    document.getElementById("cancelInsertNote").style.display = "block";
  }
  /**
   * @description Attach events
   */
  function delegate() {
    document.getElementById("addNote").addEventListener("click", addNoteButtonClick, false);
    document.getElementById("insertNote").addEventListener("click", insertNoteButtonClick, false);
    document.getElementById("cancelInsertNote").addEventListener("click", cancelInsertNoteClick, false);
  }
  function init() {
    mDb = new NotesDb();
    mDbAvailable = mDb.getAvailable();
    if (mDbAvailable) {
      getNotes();
    }
  }
  init();
};

var notesApp = new NotesApp();