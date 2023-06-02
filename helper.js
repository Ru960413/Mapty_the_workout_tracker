// Question: Can I get history weather data with the exact hour?
export const validInputs = (...inputs) =>
  inputs.every(input => Number.isFinite(input));

export const allPositiveNum = (...inputs) => inputs.every(input => input > 0);

let api_key = '28dd70395bba4363b5f52413230205';

export const getCurrentWeather = function (lat, lon) {
  // http://api.weatherapi.com/v1/current.json?key=${api_key}&q=${lat},${lon}
  fetch(
    `http://api.weatherapi.com/v1/current.json?key=${api_key}&q=${lat},${lon}`
  )
    .then(res => res.json())
    .then(data => {
      console.log(data);
      console.log(
        data.current.humidity,
        data.current.temp_c,
        data.current.feelslike_c
        // // need to get icon and Chinese text from downloaded files
        // data.current.condition.icon, // returns '//cdn.weatherapi.com/weather/64x64/day/176.png'
        // data.current.condition.text, // returns 'Patchy rain possible'
        // data.current.condition.code
      );
    });
};
