import { validInputs, allPositiveNum } from './helper.js';

// TO-DO:
// <DONE> 1. fix incorrect values of cadence and elevationGain in restoreWorkoutAsObj <had some assignment issue>
// <DONE> 2. add weather data to Running and Cycling constructor, and render them in html
// <DONE> 3. make deleteWorkout work again
// 4. try implement edit workout feature (version 3)
// 5. final check before re-deploy

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

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
    }${this.date.getDate()}日 ${this.date.getHours()}:${this.date
      .getMinutes()
      .toString()
      .padStart(2, 0)} ${this.name}`;
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
    this._renderCurrentWeatherForWorkout(this.coords[0], this.coords[1]);
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }

  _renderCurrentWeatherForWorkout() {
    // using lat, lng to get current time's temperature, humidity and weather
    let api_key = '28dd70395bba4363b5f52413230205';
    fetch(
      `https://api.weatherapi.com/v1/current.json?key=${api_key}&q=${this.coords[0]},${this.coords[1]}`
    )
      .then(res => res.json())
      .then(data => {
        // console.log(data);
        this.temp_c = data.current.temp_c;
        this.feelsLike_c = data.current.feelslike_c;
        this.humidity = data.current.humidity;
        // console.log(this.temp_c, this.feelsLike_c, this.humidity);
      });
    return this.temp_c, this.feelsLike_c, this.humidity;
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
    this._renderCurrentWeatherForWorkout(this.coords[0], this.coords[1]);
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }

  _renderCurrentWeatherForWorkout() {
    // using lat, lng to get current time's temperature, humidity and weather
    let api_key = '28dd70395bba4363b5f52413230205';
    fetch(
      `https://api.weatherapi.com/v1/current.json?key=${api_key}&q=${this.coords[0]},${this.coords[1]}`
    )
      .then(res => res.json())
      .then(data => {
        this.temp_c = data.current.temp_c;
        this.feelsLike_c = data.current.feelslike_c;
        this.humidity = data.current.humidity;
        // console.log(this.temp_c, this.feelsLike_c, this.humidity);
      });
    return this.temp_c, this.feelsLike_c, this.humidity;
  }
}

//////////////////////////////////////
// APPLICATION ARCHITECTURE

// TO-DOs aka features to implement:
// 1. delete workout (DONE)
// 2. edit a workout (Can't seem to figure this one out, next version maybe?)
// 3. remove all workouts (DONE)
// 4. More realistic error and confirmation messages (DONE)
// 5. restore Running and Cycling Objects from localStorage (DONE)
// 6. Show weather for workout, using Weather API -> add temperature, humidity and weather (DONE)

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
// const childContainerWorkout = document.querySelector('.workout');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteAllBtn = document.querySelector('.delete_all_inactive');
const editBtn = document.querySelector('.edit__btn');

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  workouts = [];

  #workoutEdit;
  #markers = [];
  #markerCounts = 0;

  constructor() {
    // Get user's position
    this._getPosition();
    this._restoreWorkoutAsObj();
    // Get data from local storage
    this._getLocalStorage();
    // Attach event handlers
    form.addEventListener('submit', this._newWorkOut.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
    containerWorkouts.addEventListener('click', this._editWorkout.bind(this));
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
    // console.log(mapE.type);
    form.classList.remove('hidden');
    inputDistance.focus();
    inputType.value = mapE.type;
    inputDistance.value = mapE.distance;
    inputDuration.value = mapE.duration;
    if (mapE.type === 'running') {
      inputCadence.value = mapE.cadence;
    } else if (mapE.type === 'cycling') {
      this._toggleElevationField();
      inputElevation.value = mapE.elevationGain;
    }
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

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    e.preventDefault();
    editBtn.classList.add('edit__btn');
    editBtn.classList.remove('edit__btn__active');
    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const temp_c = this.temp_c;
    const feelsLike_c = this.feelsLike_c;
    const humidity = this.humidity;
    let workout;

    // If workout is running, then create a running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid

      if (
        !validInputs(distance, duration, cadence) ||
        !allPositiveNum(distance, duration, cadence)
      )
        return alert('請輸入正數');

      workout = new Running(
        [lat, lng],
        distance,
        duration,
        cadence,
        temp_c,
        feelsLike_c,
        humidity
      );
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

      workout = new Cycling(
        [lat, lng],
        distance,
        duration,
        elevation,
        temp_c,
        feelsLike_c,
        humidity
      );
    }
    // Add new Object to workout array
    this.workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);
    setTimeout(() => this._renderWorkout(workout), 2000);
    // this._renderWorkout(workout);

    // Render workout on list

    // Hide form and Clear input fields
    this._hideForm();

    // <SOLVED: using settimeout> weather data can be stored in workout array, but weather data cannot be stored in localStorage
    // ISSUE => api will be called every time the page reloads, so probably should use history api instead? Nope, it won't

    // store workouts in local storage
    setTimeout(() => this._setLocalStorage(), 3000);
    // this._setLocalStorage();
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
        <span class="workout__info__title__chinese">🌡️</span>
        <span class="workout__value">${workout.temp_c}</span>
        <span class="workout__unit">°C</span>
      </div>
      <div class="workout__details">
        <span class="workout__info__title__chinese">體感🌡️</span>
        <span class="workout__value">${workout.feelsLike_c}</span>
        <span class="workout__unit">°C</span>
      </div>
      <div class="workout__details">
        <span class="workout__info__title__chinese">濕度</span>
        <span class="workout__value">${workout.humidity}</span>
        <span class="workout__unit">%</span>
      </div>
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
      </div>
      <div class="delete">X</div>
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
      </div>
      <div class="delete">X</div>
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
    // console.log(this.workouts);
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

  _restoreWorkoutAsObj() {
    let workouts = JSON.parse(localStorage.getItem('workouts'));
    let cycling = workouts
      ?.filter(workout => workout.type === 'cycling')
      .map(
        workout =>
          new Cycling(
            workout.coords,
            workout.distance,
            workout.duration,
            workout.elevationGain, //<SOLVED>
            workout.feelsLike_c,
            workout.humidity,
            workout.temp_c
          )
      );
    let running = workouts
      ?.filter(workout => workout.type === 'running')
      .map(
        workout =>
          new Running(
            workout.coords,
            workout.distance,
            workout.duration,
            workout.cadence, //<SOLVED>
            workout.feelsLike_c,
            workout.humidity,
            workout.temp_c
          )
      );
    // console.log(cycling, running);
  }

  //// Edit workout

  _displayMarker(workout) {
    console.log(this.#markers);
    this.#markers[this.#markerCounts] = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          maxWidth: 350,
          minWidth: 100,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }).setContent(`${workout.description}`)
      )
      .openPopup();
    this.#markerCounts++;
  }

  _editWorkout(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );
    form.style.gridTemplateColumns = '1.35fr 1fr';
    this._showEditForm(workout);
    editBtn.classList.remove('edit__btn');
    editBtn.classList.add('edit__btn__active');
    this.#workoutEdit = workout;
    editBtn.addEventListener('click', this._updateInfo.bind(this));
  }
  _updateInfo(e) {
    e.preventDefault();
    const workoutType = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let cadence;
    let elevation;
    if (workoutType === 'running') {
      cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositiveNum(distance, duration, cadence)
      ) {
        return alert('請輸入正數');
      }
    }
    if (workoutType === 'cycling') {
      elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositiveNum(distance, duration)
      ) {
        return alert('請輸入正數');
      }
    }

    this.#workoutEdit.type = workoutType;
    this.#workoutEdit.distance = distance;
    this.#workoutEdit.duration = duration;
    if (this.#workoutEdit.type === 'running') {
      Object.setPrototypeOf(this.#workoutEdit, Running.prototype);
      this.#workoutEdit.cadence = cadence;
      this.#workoutEdit.calcPace();
    }
    if (this.#workoutEdit.type === 'cycling') {
      Object.setPrototypeOf(this.#workoutEdit, Cycling.prototype);
      this.#workoutEdit.elevationGain = elevation;
      this.#workoutEdit.calcSpeed();
    }
    this.#workoutEdit.date = new Date(this.#workoutEdit.date);
    this.#workoutEdit._setDescription();
    console.log(this.#workoutEdit);
    // adding the marker to map again
    this.#markers.forEach(marker => this.#map.removeLayer(marker));
    this.#markerCounts--;
    console.log(this.#markerCounts);
    this.workouts.forEach(element => {
      this._displayMarker(element);
    });
    this._setLocalStorage();
    this._hideForm();
    alert('健身紀錄已成功編輯');
    location.reload();
  }
}

const app = new App();

let workouts = JSON.parse(localStorage.getItem('workouts'));
if (workouts?.length > 0) {
  deleteAllBtn.classList.remove('delete_all_inactive');
  deleteAllBtn.classList.add('delete_all_active');
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
  if (e.target.classList.contains('delete')) {
    form.style.display = 'none';
  }

  if (confirm('您確定要刪除此健身紀錄嗎？')) {
    const workoutEl = e.target.closest('.workout');
    let workouts = JSON.parse(localStorage.getItem('workouts'));
    let id = workoutEl.getAttribute('data-id');
    workouts = workouts.filter(workout => workout.id != id);
    localStorage.setItem('workouts', JSON.stringify(workouts));
    location.reload();
    alert('健身紀錄已成功刪除');
  } else {
    alert('已取消');
  }
}

const deleteBtns = document.querySelectorAll('.delete');

deleteAllBtn.addEventListener('click', deleteAllWorkouts);
deleteBtns.forEach(deleteBtn =>
  deleteBtn.addEventListener('click', deleteWorkout)
);
