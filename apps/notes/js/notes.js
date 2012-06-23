
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
   * @description Delete node
   */
  myself.deleteNote = function(id, deleteNoteCb) {
    var trans,
      store,
      data,
      request;
    trans = mDbRef.transaction(["note"], IDBTransaction.READ_WRITE);
    store = trans.objectStore("note");
    request = store.delete(id);
    request.onsuccess = function(e) {
      deleteNoteCb(true, id);
    };
    request.onerror = function(e) {
      deleteNoteCb(false, id);
    };
  };
  /**
   * @Description Update note
   */
  myself.updateNote = function (noteData, updateNoteCb) {
    //TODO
    updateNoteCb(true, noteData);
  };
  /**
   * @description Add new note
   */
  myself.addNote = function (noteText, addNoteCb) {
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
      addNoteCb(true, data);
    };
    request.onerror = function(e) {
      addNoteCb(false, data);
    };
  };
  /**
   * @description When database open was with success
   */
  function onSuccessOpen(e) {
    var v = "1.0",
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
/**
 * @description Note application class
 * @author Paul Comanici <darkyndy@gmail.com>
 */
var NotesApp = function () {
  "use strict";
  var myself = this,
    mDb,
    mDbAvailable = false,
    mNotes = [],
    mRowNr = 0,
    mInEditRow = 0;
  //NotesApp will be singleton
  if (NotesApp.myInstance) {
    return NotesApp.myInstance;
  }
  NotesApp.myInstance = myself;
  /**
   * @description Update note text
   */
  function updateNoteHtml(noteData) {
    document.querySelector("#noteRow" + mRowNr + " span").innerHTML = noteData.text;
    document.querySelector("#noteTimestamp" + mRowNr).value = noteData.timeStamp;
  }
  /**
   * @description Build html for note
   */
  function buildNoteHtml(noteData) {
    var notesContainer,
      doc,
      editEl,
      deleteEl,
      timeEl,
      noteEl,
      noteRowEl;
    mRowNr = mRowNr + 1;
    notesContainer = document.getElementById("notesContainer");
    doc = notesContainer.ownerDocument;
    //note
    noteRowEl = doc.createElement("DIV");
    noteRowEl.setAttribute("id", "noteRow" + mRowNr);
    noteRowEl.setAttribute("class", "noteRow");
    noteEl = doc.createElement("SPAN");
    noteRowEl.appendChild(noteEl);
    noteEl.innerHTML = noteData.text;
    //time
    //noteData
    timeEl = doc.createElement("INPUT");
    timeEl.setAttribute("id", "noteTimestamp" + mRowNr);
    timeEl.setAttribute("type", "hidden");
    timeEl.setAttribute("value", noteData.timeStamp);
    noteRowEl.appendChild(timeEl);
    //edit
    editEl = doc.createElement("DIV");
    editEl.setAttribute("id", "noteRowEdit" + mRowNr);
    editEl.setAttribute("class", "editNote");
    noteRowEl.appendChild(editEl);
    editEl.innerHTML = "Edit";
    //delete
    deleteEl = doc.createElement("DIV");
    deleteEl.setAttribute("id", "noteRowDelete" + mRowNr);
    deleteEl.setAttribute("class", "deleteNote");
    noteRowEl.appendChild(deleteEl);
    deleteEl.innerHTML = "Delete";
    notesContainer.appendChild(noteRowEl);
    //delegate
    delegateForNoteRow(mRowNr);
  }
  /**
   * @description Get notes callback
   */
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
  /**
   * @description Get all notes
   */
  function getNotes() {
  	var dbReady = mDb.getDbReady();
  	if (dbReady) {
  	  mDb.getAllItems(getNotesResponseCb);
  	} else {
  	  setTimeout(function () {getNotes(); }, 100);
  	}
  }
  /**
   * @description Function executed when you click on edit for a note
   */
  function editNoteButtonClick(noteRow) {
    var noteText;
    mInEditRow = noteRow;
    noteText = document.querySelector("#noteRow" + noteRow + " span").innerHTML;
    document.getElementById("addNoteContainer").value = noteText;
    addNoteButtonClick();
  }
  /**
   * @description Function executed when you click on delete for a note
   */
  function deleteNoteButtonClick(noteRow) {
    var confirmed,
      noteRowEl;
    confirmed = confirm("Are you sure you want to delete this note?");
    if (confirmed) {
      if (mInEditRow === noteRow) {
        cancelInsertNoteClick(true);
      }
      noteRowEl = document.getElementById("noteRow" + noteRow);
      noteRowEl.parentNode.removeChild(noteRowEl);
    }
  }
  /**
   * @description Attach events for note row
   * - delete and edit events
   */
  function delegateForNoteRow(noteRow) {
    document.getElementById("noteRowEdit" + noteRow).addEventListener("click", function() {editNoteButtonClick(noteRow); }, false);
    document.getElementById("noteRowDelete" + noteRow).addEventListener("click", function() {deleteNoteButtonClick(noteRow); }, false);
  }
  /**
   * @description Insert/Update note
   */
  function changeNote(successFlag, response, asUpdate) {
    var noteTextEl;
    successFlag = successFlag || false;
    asUpdate = asUpdate || false;
    if (successFlag) {
      if (asUpdate) {
        updateNoteHtml(response);
      } else {
        buildNoteHtml(response);
      }
      mInEditRow = 0;
      noteTextEl = document.getElementById("addNoteContainer");
      noteTextEl.style.display = "none";
      noteTextEl.value = "";
      document.getElementById("insertNote").style.display = "none";
      document.getElementById("cancelInsertNote").style.display = "none";
    } else {
      alert(response);
    }
  }
  /**
   * @description Update note callback
   */
  function updateNoteCb(successFlag, response) {
    changeNote(successFlag, response, true);
  }
  /**
   * @description Insert note callback
   */
  function insertNoteCb(successFlag, response) {
    changeNote(successFlag, response, false);
  }
  /**
   * @description Function executed when insert note button was clicked
   */
  function insertNoteButtonClick() {
    var noteTextEl,
      noteText,
      noteTimestamp,
      noteTextLength = 0;
    noteTextEl = document.getElementById("addNoteContainer");
    noteText = noteTextEl.value;
    //TODO: trim it
    noteTextLength = noteText.length;
    if (noteTextLength < 1) {
      alert("You must write something ...");
    } else if (noteTextLength > 255) {
      alert("You must write at most 255 characters");
    } else {
      if (mInEditRow > 0) {
        //update
        noteTimestamp = document.getElementById("noteTimestamp" + mInEditRow).value;
        noteTimestamp = parseInt(noteTimestamp, 10);
        mDb.updateNote({text: noteText, timeStamp: noteTimestamp}, updateNoteCb);
      } else {
        //insert
        mDb.addNote(noteText, insertNoteCb);
      }
    }
  }
  /**
   * @description Function executed when cancel add note button was clicked
   */
  function cancelInsertNoteClick(removeContainerValue) {
    var addNoteContainerEl;
    addNoteContainerEl = document.getElementById("addNoteContainer");
    removeContainerValue = removeContainerValue || false;
    if (removeContainerValue) {
      addNoteContainerEl.value = "";
    }
    mInEditRow = 0;
    addNoteContainerEl.style.display = "none";
    document.getElementById("insertNote").style.display = "none";
    document.getElementById("cancelInsertNote").style.display = "none";
  }
  /**
   * @description Function executed when add note button was clicked
   */
  function addNoteButtonClick() {
    var insertText = "Insert",
      insertNodeEl;
    insertNodeEl = document.getElementById("insertNote");
    if (mInEditRow > 0) {
      insertText = "Edit";
    }
    insertNodeEl.innerHTML = insertText;
    document.getElementById("addNoteContainer").style.display = "block";
    insertNodeEl.style.display = "block";
    document.getElementById("cancelInsertNote").style.display = "block";
  }
  /**
   * @description Attach events
   */
  function delegate() {
    document.getElementById("addNote").addEventListener("click", function () {
      mInEditRow = 0;
      addNoteButtonClick();
    }, false);
    document.getElementById("insertNote").addEventListener("click", insertNoteButtonClick, false);
    document.getElementById("cancelInsertNote").addEventListener("click", cancelInsertNoteClick, false);
  }
  /**
   * @description Initialize
   */
  function init() {
    mDb = new NotesDb();
    mDbAvailable = mDb.getAvailable();
    delegate();
    if (mDbAvailable) {
      getNotes();
    }
  }
  init();
};

window.addEventListener("DOMContentLoaded", function () {
  var notesApp = new NotesApp();
}, false);