let db;

const request = indexedDB.open('budget_tracker', 1);

//this event will emit if the database version changes(nonexistant to v1, v2, etc.)
request.onupgradeneeded = function(event) {
    //save a reference to the database
    const db = event.target.result;
    // create an object store (table) called "new_budget", set it to have an autoincrementig primary key of sorts
    db.createObjectStore('new_budget', { autoIncrement: true });
}

//upon successfull
request.onsuccess = function(event) {
    db = event.target.result;

    if( navigator.onLine ) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_budget'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_budget');

    budgetObjectStore.add(record);
}

function uploadBudget() {
    //open transaction on your db
    const transaction = db.transaction(['new_budget'], 'readwrite');

    //access the object store
    const budgetObjectStore = transaction.objectStore('new_budget');

    //get all records from the store and set to a variable
    const getAll = budgetObjectStore.getAll();

    //upon successful .getAll() execution, run this function
    getAll.onsuccess = function() {

        //if there was data in indexedDB's store, let's send it to the api server
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction(['new_budget'], 'readwrite');
                //access the new_budget object store
                const budgetObjectStore = transaction.objectStore('new_budget');
                //clear all items in your store
                budgetObjectStore.clear();

                alert("All saved offline transactions have been submitted!")
            })
            .catch(err => {
                console.log(err);
            })
        }
    };
}

window.addEventListener('online', uploadBudget);