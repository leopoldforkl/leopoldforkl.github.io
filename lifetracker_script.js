const API_URL = 'https://script.google.com/macros/s/AKfycbyZX4VMQjRNaf1cuu4RgUvzcicZeFjQ-WxoWUiABIEO5uIdH8oIpVbLMuntTj2O0oCmdg/exec'; // Replace with your Google Web App URL

document.getElementById('loginButton').addEventListener('click', function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if(username === 'Leopold' && password === '0307') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('personalSpace').style.display = 'block';
        loadThoughts();
    } else {
        alert('Incorrect username or password!');
    }
});

document.getElementById('logoutButton').addEventListener('click', function() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('personalSpace').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

document.getElementById('thoughtForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const date = document.getElementById('date').value;
    const thought = document.getElementById('thought').value;

    if(date && thought) {
        saveThought(date, thought);
        document.getElementById('date').value = '';
        document.getElementById('thought').value = '';
    }
});

function saveThought(date, thought) {
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, thought })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        loadThoughts();
    })
    .catch(error => console.error('Error:', error));
}

function loadThoughts() {
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            displayThoughts(data);
        })
        .catch(error => console.error('Error:', error));
}

function displayThoughts(thoughts) {
    const tableBody = document.querySelector('#thoughtTable tbody');
    tableBody.innerHTML = '';
    thoughts.forEach(thought => {
        const row = document.createElement('tr');
        const dateCell = document.createElement('td');
        const thoughtCell = document.createElement('td');
        dateCell.textContent = thought.date;
        thoughtCell.textContent = thought.thought;
        row.appendChild(dateCell);
        row.appendChild(thoughtCell);
        tableBody.appendChild(row);
    });
}

