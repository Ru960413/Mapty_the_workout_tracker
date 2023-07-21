# Mapty 以地圖紀錄健身

- [Mapty 以地圖紀錄健身](#mapty-以地圖紀錄健身)
  - [Website](#website)
    - [所使用的技術](#所使用的技術)
    - [Project 介紹](#project-介紹)
    - [動機及 project 設計](#動機及-project-設計)
    - [Project 重點](#project-重點)
  - [Project Introduction](#project-introduction)

## Website

<https://maptytheworkouttracker-production.up.railway.app/>

![Cover](for_readme/Cover.png 'Cover')

### 所使用的技術

    1. HTML
    2. CSS
    3. JavaScript
    4. localStorage API

### Project 介紹

這是一個由 HTML, CSS 以及 JavaScript 所寫成的健身紀錄地圖，使用者可點選地圖紀錄健身（可支援跑步及騎腳踏車兩項），並將這些紀錄儲存在 localStorage 之中，除此之外亦可以刪除單一健身紀錄以及刪除所有健身紀錄。

### 動機及 project 設計

這是在上 Udemey 平台上的老師 Jonas Schmedtmann 所開設的 JavaScript 課程之中 JavaScript OOP 的課程裡的 project，在上課時只有做到添加新健身紀錄以及點選左側的健身紀錄將 marker 置於地圖的正中心，而我則另外寫了一些其他的功能，這些功能包括：刪除單一健身紀錄、刪除所有健身紀錄、編輯健身紀錄、project 中文化、由 localStorage 之中將健身紀錄回復成最原始的物件（Running 與 Cycling）等。

### Project 重點

1. 加入健身紀錄

   ![跑步](for_readme/running.png '跑步')

   ![騎腳踏車](for_readme/cycling.png '騎腳踏車')

2. 刪除健身紀錄

   ![刪除單一健身紀錄](for_readme/delete_this.png '刪除單一健身紀錄')

   ![刪除所有健身紀錄](for_readme/delete_all.png '刪除所有健身紀錄')

3. 編輯健身紀錄

![編輯健身紀錄](for_readme/edit.png '編輯健身紀錄')

## Project Introduction

This is a workout tracker built with HTML, CSS, JavaScript, leaflet API, JavaScript's localStorage API, and weather API.

It allows users to click on the map on the right side of the website to add a workout (running or cycling) using its form. After submitting the workout, the workout will then show as a list below the form. User can also edit workout by clicking the workout, delete workout by clicking the delete button and delete all workouts by clicking the button bellow the list.
