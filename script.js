'use strict';
//import { validInputs, allPositiveNum } from 'helper.js';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    this.description = `${
      months[this.date.getMonth()]
    }${this.date.getDate()}日 ${this.name}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  name = '跑步';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  name = '騎腳踏車';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([120, 24], 5.2, 24, 178)
// const cycling1 = new Cycling([120, 24], 27, 95, 523)
// console.log(run1, cycling1);

//////////////////////////////////////
// APPLICATION ARCHITECTURE

// TO-DOs aka features to implement:
// 1. delete workout (DONE)
// 2. edit a workout (Can't seem to figure this one out, next version maybe?)
// 3. remove all workouts (DONE)
// 4. More realistic error and confirmation messages (DONE)
// 5. restore Running and Cycling Objects from localStorage
// 6. Show weather for workout, using Weather API -> add temperature, humidity and weather(這個我還不會😅)

const form = document.querySelector('.form');
const formEdit = document.querySelector('.form-edit');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
//const deleteBtn = document.querySelector('.delete');
//const editBtn = document.querySelector('.edit');
const deleteAllBtn = document.querySelector('.delete_all');

const validInputs = (...inputs) =>
  inputs.every(input => Number.isFinite(input));

const allPositiveNum = (...inputs) => inputs.every(input => input > 0);

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  workouts = [];

  constructor() {
    // Get user's position
    this._getPosition();
    // this._restoreWorkoutAsObj();
    // Get data from local storage
    this._getLocalStorage();
    // Attach event handlers
    form.addEventListener('submit', this._newWorkOut.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('無法獲取您的位置🙁');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    //console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    // binding the this key word to the app obj instead of the map itself
    this.#map.on('click', this._showForm.bind(this));

    // add workout markers after the map is loaded
    this.workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _showEditForm(mapE) {
    this.#mapEvent = mapE;
    formEdit.style.display = 'grid';
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputDuration.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _hideEditForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputDuration.value =
        '';
    formEdit.style.display = 'none';
    setTimeout(() => (formEdit.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    e.preventDefault();
    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout is running, then create a running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid

      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositiveNum(distance, duration, cadence)
      )
        return alert('請輸入正數');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // else create a cycling object
    if (type === 'cycling') {
      // Check if data is valid
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositiveNum(distance, duration, elevation)
      )
        return alert('請輸入正數');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new Object to workout array
    this.workouts.push(workout);
    // console.log(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);

    // Render workout on list

    // Hide form and Clear input fields
    this._hideForm();

    // store workouts in local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    // Display Marker
    L.marker(workout.coords)
      // error here
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♀️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♀️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
        <div class="delete">X</div>
      </div>
    </li>
        `;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/hr</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">M</span>
        <div class="delete">X</div>
      </div>
    </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopUp(e) {
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    // console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  // Will lost the original prototype chain
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    // restoring the data
    this.workouts = data;

    this.workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  // _restoreWorkoutAsObj() {
  //   let cycling = JSON.parse(localStorage.getItem('workouts'))
  //     .filter(workout => workout.type === 'cycling')
  //     .map(
  //       workout =>
  //         new Cycling(
  //           workout.coords,
  //           workout.distance,
  //           workout.duration,
  //           workout.date,
  //           workout.id,
  //           workout.elevationGain
  //         )
  //     );
  //   let running = JSON.parse(localStorage.getItem('workouts'))
  //     .filter(workout => workout.type === 'running')
  //     .map(
  //       workout =>
  //         new Running(
  //           workout.coords,
  //           workout.distance,
  //           workout.duration,
  //           workout.date,
  //           workout.id,
  //           workout.cadence
  //         )
  //     );
  //   console.log(cycling, running);
  // }

}

const app = new App();

if (localStorage.getItem('workouts')) {
  deleteAllBtn.style.display = 'flex';
}

function deleteAllWorkouts() {
  if (confirm('您確定要刪除所有的健身紀錄嗎？')) {
    localStorage.removeItem('workouts');
    location.reload();
    alert('健身紀錄已清空');
  } else {
    alert('已取消');
  }
}

function deleteWorkout(e) {
  if (confirm('您確定要刪除此健身紀錄嗎？')) {
    const workoutEl = e.target.closest('.workout');
    localStorage.getItem('workouts');
    const workouts = JSON.parse(localStorage.getItem('workouts'));
    for (let i = 0; i < workouts.length; i++) {
      if ((workouts[i].id = workoutEl.getAttribute('data-id'))) {
        workouts.splice(i, 1);
        break;
      }
    }
    localStorage.setItem('workouts', JSON.stringify(workouts));
    location.reload();
    alert('健身紀錄已成功刪除');
  } else {
    alert('已取消');
  }
}

// function editWorkout(e) {
//   const workoutEl = e.target.closest('.workout');
//   const workouts = JSON.parse(localStorage.getItem('workouts'));
//   const workout = workouts.find(work => work.id === workoutEl.dataset.id);
//   app._showEditForm();
//   // console.log(workoutEl);
//   //console.log(workout.coords);
//   const distance = +inputDistance.value;
//   const duration = +inputDuration.value;
//   const cadence = +inputCadence.value;
//   const elevationGain = +inputElevation.value;
//   console.log(distance, duration, cadence, elevationGain);

// workout.distance = distance;
// workout.duration = duration;
// workout.coords = workout.coords;

// if (workout.type === 'running') {
//   workout.cadence = cadence;
// } else {
//   workouts.elevationGain = elevationGain;
// }

// app._hideEditForm();
//}

const deleteBtns = document.querySelectorAll('.delete');
//const editBtns = document.querySelectorAll('.edit');
deleteAllBtn.addEventListener('click', deleteAllWorkouts);
deleteBtns.forEach(deleteBtn =>
  deleteBtn.addEventListener('click', deleteWorkout)
);
//editBtns.forEach(editBtn => editBtn.addEventListener('click', editWorkout));
