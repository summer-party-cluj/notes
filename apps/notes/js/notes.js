
/**
 * @description Note application class
 * @author Paul Comanici <darkyndy@gmail.com>
 */
var NotesApp = function () {
  "use strict";
  var myself = this,
    notesDb,
    mNotes = [],
    mRowNr = 0,
    mInEditRow = 0;
  //NotesApp will be singleton
  if (NotesApp.myInstance) {
    return NotesApp.myInstance;
  }
  NotesApp.myInstance = myself;
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
      noteTextEl,
      noteRowEl,
      noteText;
    mRowNr = mRowNr + 1;
    notesContainer = document.getElementById("notesContainer");
    doc = notesContainer.ownerDocument;
    //note
    noteRowEl = doc.createElement("DIV");
    noteRowEl.setAttribute("id", "noteRow" + mRowNr);
    noteRowEl.setAttribute("class", "noteRow");
    noteRowEl.setAttribute("data-id", noteData.id);
    //text
    noteEl = doc.createElement("SPAN");
    noteRowEl.appendChild(noteEl);
    noteText = noteData.text;
    noteEl.innerHTML = getNoteTextForView(noteText);
    //write initial text in textarea
    noteTextEl = doc.createElement("TEXTAREA");
    noteTextEl.setAttribute("id", "noteText" + mRowNr);
    noteTextEl.setAttribute("class", "hide");
    noteRowEl.appendChild(noteTextEl);
    noteTextEl.value = noteText;
    //time
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
    notesContainer.insertBefore(noteRowEl, notesContainer.childNodes[0]);
    //delegate
    delegateForNoteRow(mRowNr);
  }
  /**
   * @description Get notes callback
   */
  function onLoadCb(notes) {
    var notesLength = 0,
      i = 0,
      j = 0,
      sortedNotesIndexes = [],
      sortedTimes = [],
      maxTime = 0,
      tempTime;
    notesLength = notes.length;
    if (notesLength === 0) {
      addNoteButtonClick();
    } else {
      for (i = 0; i < notesLength; i = i +1) {
        tempTime = notes[i].time;
        sortedTimes.push(tempTime);
      }
      //sortedTimes.sort(function(a,b){return a-b});
      sortedTimes.sort();
      for (i = 0; i < notesLength; i = i +1) {
        for (j = 0; j < notesLength; j = j +1) {
          tempTime = notes[j].time;
          if (tempTime === sortedTimes[i]) {
            buildNoteHtml(notes[j]);
          }
        }
      }
    }
  }
  /**
   * @description Function executed when you click on edit for a note
   */
  function editNoteButtonClick(noteRow) {
    var noteText;
    mInEditRow = noteRow;
    noteText = document.querySelector("#noteText" + noteRow).value;
    document.getElementById("addNoteContainer").value = noteText;
    addNoteButtonClick();
  }
  /**
   * 
   * @param On delete callback
   */
  function onDeleteCb(noteId) {
    var noteRowEl;
    noteRowEl = document.querySelector("[data-id='" + noteId + "']");
    noteRowEl.parentNode.removeChild(noteRowEl);
  }
  /**
   * @description Function executed when you click on delete for a note
   */
  function deleteNoteButtonClick(noteRow) {
    var confirmed,
      noteRowEl,
      noteId;
    confirmed = confirm("Are you sure you want to delete this note?");
    if (confirmed) {
      if (mInEditRow === noteRow) {
        cancelInsertNoteClick(true);
      }
      noteRowEl = document.getElementById("noteRow" + noteRow);
      noteId = noteRowEl.getAttribute("data-id");
      noteId = parseInt(noteId, 10);
      notesDb.delete(noteId);
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
   * @description Get note text for view (HTML)
   * @param noteText
   * @returns
   */
  function getNoteTextForView(noteText) {
    noteText = noteText.replace(/\n/gmi, "<br>");
    return noteText;
  }
  /**
   * @description Update note
   * @param note
   * @returns
   */
  function updateNoteHtml(note) {
    var noteText,
      noteRowEl;
    noteText = note.text;
    document.querySelector("#noteRow" + mInEditRow + " span").innerHTML = getNoteTextForView(noteText);
    document.getElementById("noteText" + mInEditRow).value = noteText;
    noteRowEl = document.getElementById("noteRow" + mInEditRow);
    noteRowEl.parentNode.insertBefore(noteRowEl, notesContainer.childNodes[0]);
  }
  /**
   * @description Insert/Update note
   */
  function changeNote(note, successFlag, asUpdate) {
    var noteTextEl;
    successFlag = successFlag || false;
    asUpdate = asUpdate || false;
    if (successFlag) {
      noteTextEl = document.getElementById("addNoteContainer");
      noteTextEl.value = "";
      toggleUpdateBlock();
      if (asUpdate) {
        updateNoteHtml(note);
      } else {
        buildNoteHtml(note);
      }
      mInEditRow = 0;
    } else {
      alert(note);
    }
  }
  /**
   * @description Insert note callback
   */
  function onPutCb(note, response, asUpdate) {
    var successFlag = false;
    asUpdate = asUpdate || false;
    if (response && response.type) {
      if (response.type === "success") {
        successFlag = true;
      }
    }
    if (!successFlag) {
      note = response;
    }
    changeNote(note, successFlag, asUpdate);
  }
  /**
   * @description Function executed when insert note button was clicked
   */
  function insertNoteButtonClick() {
    var noteTextEl,
      noteText,
      noteTextLength = 0,
      noteId = 0,
      noteItem = {};
    noteTextEl = document.getElementById("addNoteContainer");
    noteText = noteTextEl.value;
    //TODO: trim it
    noteTextLength = noteText.length;
    if (noteTextLength < 1) {
      alert("You must write something ...");
    } else if (noteTextLength > 255) {
      alert("You must write at most 255 characters");
    } else {
      noteItem.text = noteText;
      noteItem.time = (new Date()).getTime();
      if (mInEditRow > 0) {
        //update
        noteId = document.getElementById("noteRow" + mInEditRow).getAttribute("data-id");
        noteId = parseInt(noteId, 10);
        noteItem.id = noteId;
        notesDb.update(noteItem);
      } else {
        //insert
        notesDb.put(noteItem);
      }
    }
  }
  /**
   * @description Toggle update block
   * @returns
   */
  function toggleUpdateBlock(toggleFlag) {
    var displayStyle = "none";
    toggleFlag = toggleFlag || false;
    if (toggleFlag) {
      displayStyle = "block";
    }
    document.getElementById("updateNoteContainer").style.display = displayStyle;
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
    toggleUpdateBlock(false);
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
    toggleUpdateBlock(true);
    document.getElementById("addNoteContainer").focus();
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
    notesDb = new NotesDb(onLoadCb, onPutCb, onDeleteCb);
    delegate();
    notesDb.load();
  }
  init();
};

window.addEventListener("DOMContentLoaded", function () {
  var notesApp = new NotesApp();
}, false);