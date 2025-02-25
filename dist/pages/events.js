// src/pages/events.js

import { auth, db } from '../firebase.js';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { showAlert } from '../utils/alerts.js';

// We'll import jQuery and select2
import $ from 'jquery';
import 'select2';
import 'select2/dist/css/select2.min.css'; // optional styles

export function initEventForm() {
  const eventForm = document.getElementById('event-form');
  if (!eventForm) return;

  let validPlaceSelected = false;

  // 1) If event type = "Other", show additional input
  const eventTypeSelect = document.getElementById('event-type');
  const otherContainer = document.getElementById('other-event-type-container');
  const otherInput = document.getElementById('other-event-type');

  if (eventTypeSelect) {
    eventTypeSelect.addEventListener('change', function() {
      if (this.value === "Other") {
        otherContainer.style.display = "block";
        otherInput.required = true;
      } else {
        otherContainer.style.display = "none";
        otherInput.required = false;
        otherInput.value = "";
      }
    });
  }

  // 2) If invites only => show invites container
  const inviteTypeSelect = document.getElementById('invite-type');
  const inviteesContainer = document.getElementById('invitees-container');
  const inviteesSelect = document.getElementById('invitees-select');

  if (inviteTypeSelect) {
    inviteTypeSelect.addEventListener('change', function() {
      if (this.value === 'invites') {
        inviteesContainer.style.display = 'block';
      } else {
        inviteesContainer.style.display = 'none';
        if (inviteesSelect) inviteesSelect.selectedIndex = -1;
      }
    });
  }

  // 3) Initialize Select2 for #invitees-select
  $(document).ready(() => {
    $('#invitees-select').select2({
      placeholder: "Search and invite users",
      allowClear: true
    });
  });

  // 4) Ticketing logic
  const ticketingSelect = document.getElementById('ticketing');
  const ticketPriceContainer = document.getElementById('ticket-price-container');
  const ticketPriceInput = document.getElementById('ticket-price');

  if (ticketingSelect) {
    ticketingSelect.addEventListener('change', function() {
      if (this.value === "Yes") {
        ticketPriceContainer.style.display = "block";
        ticketPriceInput.required = true;
      } else {
        ticketPriceContainer.style.display = "none";
        ticketPriceInput.required = false;
        ticketPriceInput.value = "";
      }
    });
  }

  // 5) datetime-local color logic
  const datetimeInputs = document.querySelectorAll('input[type="datetime-local"]');
  datetimeInputs.forEach(input => {
    input.addEventListener('input', function() {
      this.style.color = this.value ? 'black' : '#908d8d';
    });
    if (input.value) input.style.color = 'black';
    else input.style.color = '#908d8d';
  });

  // 6) dropdown color logic
  const selectElements = document.getElementsByClassName('dropdown');
  for (const selectEl of selectElements) {
    selectEl.addEventListener('change', function() {
      this.style.color = this.value === "" ? '#908d8d' : 'black';
    });
    selectEl.style.color = selectEl.value === "" ? '#908d8d' : 'black';
  }

  // 7) Confirmation modal
  const confirmOverlay = document.getElementById('confirm-overlay');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo  = document.getElementById('confirm-no');

  // On form submit, show the confirmation overlay
  eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validPlaceSelected) {
        showAlert('Invalid Address','Please select a valid location from the dropdown');
        return; // Stop form submission
    }
    if (confirmOverlay) confirmOverlay.style.display = 'flex';
  });

  // -- (A) We'll store lat/long in these variables
  let latitude = null;
  let longitude = null;

  // If user clicks "Yes", create the event in Firestore
  if (confirmYes) {
    confirmYes.addEventListener('click', async function() {
        if (confirmOverlay) confirmOverlay.style.display = 'none';

        // Gather form data
        const eventName = document.getElementById('event-name').value;
        const location  = document.getElementById('search-input').value;
        const selectedType = eventTypeSelect.value;
        const otherVal = otherInput.value;
        const finalEventType = (selectedType === 'Other') ? otherVal : selectedType;

        // time
        const startString = document.getElementById('start-time').value; 
        // e.g. "2023-09-12T21:00" from datetime-local

        // Convert to a JS Date
        const startDate = new Date(startString);

        // Convert to Firestore Timestamp
        const startTimeTimestamp = Timestamp.fromDate(startDate);

        // Do the same for end-time
        const endString = document.getElementById('end-time').value;
        const endDate = new Date(endString);
        const endTimeTimestamp = Timestamp.fromDate(endDate);


        const venueName = document.getElementById('venue-name').value || null;
        const inviteType = inviteTypeSelect.value || null;

        let invitees = [];
        if (inviteType === 'invites') {
            invitees = Array
            .from(inviteesSelect.selectedOptions)
            .map(opt => opt.value);
        }

        const ticketing = ticketingSelect.value;
        const ticketPrice = (ticketing === 'Yes')
            ? (document.getElementById('ticket-price').value || null)
            : null;
        const capacity = (ticketing === 'Yes')
            ? (document.getElementById('capacity').value || null)
            : null;
        const eventDescription = document.getElementById('event-description').value || null;

        const user = auth.currentUser;

        try {
            const eventData = {
                eventName,
                startTime: startTimeTimestamp,
                endTime: endTimeTimestamp,
                createdAt: Timestamp.now(),
                latitude,
                longitude,
                eventType: finalEventType,
                venueName,
                inviteType,
                invitees,
                ticketing,
                ticketPrice,
                capacity,
                eventDescription,
                createdBy: user.uid
            };
            // Write to Firestore
            await addDoc(collection(db, 'events'), eventData);

            // Show "Success" message with a callback that resets the form
            showAlert('Success!', 'Your event is now on the map.', () => {
                window.location.href = '/dashboard.html';
            });

        } catch (error) {
            console.error('Error creating event:', error);
            showAlert('Error', error.message);
        }
        });
  }

  // If user clicks "No", just hide the overlay
  if (confirmNo) {
    confirmNo.addEventListener('click', function() {
      if (confirmOverlay) confirmOverlay.style.display = 'none';
    });
  }

  // 8) Handle side gradient placeholder -> user upload logic
  const partyImageDiv = document.getElementById('party-image');
  const placeholderText = document.getElementById('placeholder-text');
  const fileInput = document.getElementById('image-upload');
  const changeImageButton = document.querySelector('.change-image-btn');

  // Initialize the Google Map + Autocomplete:
  initCreateEventMap();

  function triggerFileInput() {
    if (fileInput) fileInput.click();
  }

  if (partyImageDiv) {
    partyImageDiv.addEventListener('click', triggerFileInput);
  }
  if (changeImageButton) {
    changeImageButton.addEventListener('click', triggerFileInput);
  }

  if (fileInput) {
    fileInput.addEventListener('change', function(event) {
      if (event.target.files && event.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          partyImageDiv.style.background = `url('${e.target.result}') center center / cover no-repeat`;
          placeholderText.style.display = 'none';
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    });
  }

  function initCreateEventMap() {
    const searchInput = document.getElementById('search-input');
    const mapDiv = document.getElementById('map');
    // If these don't exist, bail out
    if (!searchInput || !mapDiv) return;
  
    const map = new google.maps.Map(mapDiv, {
      zoom: 15,
      center: { lat: 40.8068, lng: -73.9617 },
      scrollwheel: true,
    });
  
    const marker = new google.maps.Marker({ map });
  
    const autocomplete = new google.maps.places.Autocomplete(searchInput, {
    });
    autocomplete.bindTo('bounds', map);

    // (A) Listen for "place_changed"
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
        // If no geometry, invalid place
        validPlaceSelected = false;
        showAlert('Invalid Address','Please select a valid location from the dropdown');
        return;
        }

        // We have a valid place:
        validPlaceSelected = true;

        if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
        } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
        }
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);

        // Store lat/lng as needed
        latitude = place.geometry.location.lat();
        longitude = place.geometry.location.lng();
    });

    // (B) If user types after selecting a place, reset validPlaceSelected
    searchInput.addEventListener('input', () => {
        validPlaceSelected = false;
    });
  }
}
