let itineraryData = [
  {
    "week": "Week 1: Arrival & Eastern Japan",
    "items": [
      {
        "activity": "Tokyo – Multiple days",
        "duration": "4 days",
        "participants": [
          "Okke",
          "Patrick",
          "Mittchel"
        ]
      },
      {
        "activity": "Machida – Day trip from Tokyo",
        "duration": "1 day",
        "participants": [
          "Patrick"
        ]
      },
      {
        "activity": "Nakasendo – One day overnight from Tokyo/Nagoya",
        "duration": "2 days",
        "participants": [
          "Okke",
          "Patrick"
        ]
      },
      {
        "activity": "Kanazawa – Day trip from Tokyo/Nagoya",
        "duration": "1 day",
        "participants": [
          "Mittchel",
          "Okke"
        ]
      },
      {
        "activity": "Takayama – Multiple days from Tokyo/Nagoya",
        "duration": "2 days",
        "participants": [
          "Mittchel",
          "Okke"
        ]
      },
      {
        "activity": "Sendai – Multiple days",
        "duration": "1 day",
        "participants": [
          "Okke",
          "Patrick",
          "Mittchel"
        ]
      }
    ]
  },
  {
    "week": "Week 2: Northern & Western Japan",
    "items": [
      {
        "activity": "Yamagata – Day trip from Sendai",
        "duration": "1 day",
        "participants": [
          "Mittchel",
          "Okke",
          "Patrick"
        ]
      },
      {
        "activity": "Hinoemata – Day trip from Sendai",
        "duration": "1 day",
        "participants": [
          "Mittchel",
          "Okke"
        ]
      },
      {
        "activity": "Kyoto – Multiple days",
        "duration": "2 days",
        "participants": [
          "Okke",
          "Mittchel",
          "Patrick"
        ]
      },
      {
        "activity": "Osaka – Day trip from Kyoto",
        "duration": "1 day",
        "participants": [
          "Okke",
          "Patrick",
          "Mittchel"
        ]
      },
      {
        "activity": "Nara – Day trip from Kyoto",
        "duration": "1 day",
        "participants": [
          "Patrick",
          "Mittchel",
          "Okke"
        ]
      },
      {
        "activity": "Kobe – Day trip from Kyoto",
        "duration": "1 day",
        "participants": [
          "Mittchel",
          "Okke",
          "Patrick"
        ]
      },
      {
        "activity": "Awaji Island – Day trip from Kyoto",
        "duration": "1 day",
        "participants": [
          "Mittchel",
          "Patrick",
          "Okke"
        ]
      },
      {
        "activity": "Izumo – Day trip from Osaka",
        "duration": "1 day",
        "participants": [
          "Mittchel",
          "Patrick"
        ]
      },
      {
        "activity": "Hiroshima – One day overnight from Osaka",
        "duration": "2 days",
        "participants": [
          "Mittchel",
          "Patrick"
        ]
      }
    ]
  },
  {
    "week": "Week 3: Southern Japan & Return to Tokyo",
    "items": [
      {
        "activity": "Fukuoka – Multiple days",
        "duration": "3 days",
        "participants": [
          "Okke",
          "Patrick",
          "Mittchel"
        ]
      },
      {
        "activity": "Kitakyushu – Together with Fukuoka",
        "duration": "1 day",
        "participants": [
          "Mittchel",
          "Okke",
          "Patrick"
        ]
      },
      {
        "activity": "Oita – Day trip from Fukuoka",
        "duration": "1 day",
        "participants": [
          "Mittchel",
          "Okke",
          "Patrick"
        ]
      },
      {
        "activity": "Beppu – Day trip from Fukuoka",
        "duration": "1 day",
        "participants": [
          "Mittchel",
          "Okke",
          "Patrick"
        ]
      },
      {
        "activity": "Tokyo – Return and departure",
        "duration": "4 days",
        "participants": [
          "Okke",
          "Patrick",
          "Mittchel"
        ]
      }
    ]
  }
];

const people = ["Mittchel", "Okke", "Patrick"];

function renderItinerary() {
  const container = document.getElementById("itinerary-container");
  container.innerHTML = "";
  itineraryData.forEach((weekData, weekIndex) => {
    const section = document.createElement("div");
    section.className = "week-section";
    const header = document.createElement("h2");
    header.className = "collapsible";
    header.textContent = "🗓️ " + weekData.week;
    section.appendChild(header);
    const content = document.createElement("div");
    content.className = "content";
    content.setAttribute("data-week-index", weekIndex);
    const ul = document.createElement("ul");
    weekData.items.forEach((itemData, itemIndex) => {
      const li = document.createElement("li");
      const editableDiv = document.createElement("div");
      editableDiv.contentEditable = true;
      editableDiv.textContent = itemData.activity;
      if (itemData.duration) editableDiv.title = itemData.duration;
      editableDiv.className = "activity-card";
      editableDiv.addEventListener("input", function () {
        itineraryData[weekIndex].items[itemIndex].activity = this.textContent;
      });
      li.appendChild(editableDiv);
      if (!itemData.activity.toLowerCase().startsWith("base")) {
        people.forEach(person => {
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = itemData.participants.includes(person);
          checkbox.dataset.person = person;
          checkbox.dataset.weekIndex = weekIndex;
          checkbox.dataset.itemIndex = itemIndex;
          checkbox.addEventListener("change", updateParticipants);
          li.appendChild(checkbox);
          const nameLabel = document.createElement("label");
          nameLabel.textContent = person;
          li.appendChild(nameLabel);
        });
      }
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️";
      deleteBtn.className = "delete-btn";
      deleteBtn.addEventListener("click", function () {
        itineraryData[weekIndex].items.splice(itemIndex, 1);
        renderItinerary();
      });
      li.appendChild(deleteBtn);
      ul.appendChild(li);
    });
    const addBtn = document.createElement("button");
    addBtn.textContent = "➕ Add Activity";
    addBtn.className = "add-btn";
    addBtn.addEventListener("click", function () {
      itineraryData[weekIndex].items.push({ activity: "New Activity", participants: [] });
      renderItinerary();
    });
    content.appendChild(ul);
    content.appendChild(addBtn);
    section.appendChild(content);
    container.appendChild(section);
  });
  document.querySelectorAll(".collapsible").forEach(header => {
    header.addEventListener("click", function () {
      const content = this.nextElementSibling;
      content.style.display = content.style.display === "block" ? "none" : "block";
    });
  });
}

function updateParticipants(e) {
  const person = e.target.dataset.person;
  const weekIndex = e.target.dataset.weekIndex;
  const itemIndex = e.target.dataset.itemIndex;
  const participants = itineraryData[weekIndex].items[itemIndex].participants;
  if (e.target.checked) {
    if (!participants.includes(person)) participants.push(person);
  } else {
    const idx = participants.indexOf(person);
    if (idx !== -1) participants.splice(idx, 1);
  }
}

function saveItinerary() {
  const updatedJS = `let itineraryData = ${JSON.stringify(itineraryData, null, 2)};`;
  navigator.clipboard.writeText(updatedJS)
    .then(() => alert("Updated itinerary copied to clipboard!"))
    .catch(err => console.error("Clipboard copy failed:", err));
}

// Apply dark mode on initial load
document.addEventListener("DOMContentLoaded", function () {
  renderItinerary();
  document.body.classList.add("dark-mode");
  document.querySelectorAll(".week-section, .collapsible, .content, li").forEach(el => {
    el.classList.add("dark-mode");
  });

  const toggleBtn = document.getElementById("darkModeToggle");
  if (toggleBtn) {
    toggleBtn.textContent = "🌞";
    toggleBtn.addEventListener("click", function () {
      const isDark = document.body.classList.contains("dark-mode");
      document.body.classList.toggle("dark-mode", !isDark);
      toggleBtn.textContent = isDark ? "🌙" : "🌞";
      document.querySelectorAll(".week-section, .collapsible, .content, li").forEach(el => {
        el.classList.toggle("dark-mode", !isDark);
      });
    });
  }
});


function showActivitySummary() {
    const summaryContainer = document.getElementById("summaryContainer");
    summaryContainer.innerHTML = "";
    const personMap = {};
    people.forEach(p => personMap[p] = []);
    itineraryData.forEach(week => {
        week.items.forEach(item => {
            item.participants.forEach(p => {
                personMap[p].push(item.activity);
            });
        });
    });
    for (const person in personMap) {
        const card = document.createElement("div");
        card.className = "summary-card";
        const title = document.createElement("h3");
        title.textContent = person;
        card.appendChild(title);
        const ul = document.createElement("ul");
        personMap[person].forEach(act => {
            const li = document.createElement("li");
            li.textContent = act;
            ul.appendChild(li);
        });
        card.appendChild(ul);
        summaryContainer.appendChild(card);
    }
    summaryContainer.style.display = "block";
	  document.querySelectorAll(".week-section, .collapsible, .content, li").forEach(el => {
    el.classList.add("dark-mode");
  });
}

document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("showSummaryBtn");
    if (btn) {
        btn.addEventListener("click", showActivitySummary);
    }
});
