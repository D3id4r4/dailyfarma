/* =========================================
   SUPABASE CONFIGURATION
========================================= */

const SUPABASE_URL =
  "https://npzvcdpuovtziwrcdpkw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_J8-OnH2C08F40aX0-Foskg_ZfAe5l4w";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

/* =========================================
   QUESTIONS
========================================= */

let questions = [];


/* =========================================
   LOAD QUESTIONS FROM SUPABASE
========================================= */

async function loadQuestions() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("questions")
        .select("*")
        .order(
          "id",
          {
            ascending: true
          }
        );


    if (error) {

      throw error;

    }


    questions =
      data.map(
        question => ({

          id:
            question.id,


          category:
            question.category,


          difficulty:
            question.difficulty,


          question:
            question.question,


          options: [

            question.option_a,

            question.option_b,

            question.option_c,

            question.option_d

          ],


          /*
            Jouw bestaande quiz gebruikt:

            currentQuestion.correct

            Daarom gebruiken we hier
            "correct" en niet "correctAnswer".
          */

          correct:
            question.correct_answer,


          explanation:
            question.explanation,


          hint:
            question.hint

        })
      );


    console.log(
      "Vragen geladen uit Supabase:",
      questions
    );


    if (
      questions.length === 0
    ) {

      console.warn(
        "Er zijn nog geen vragen gevonden in Supabase."
      );

      return;

    }


    /*
      Reset dagelijkse quiz
    */

    score = 0;

    selectedAnswer = null;

    answered = false;

    hasAnsweredToday = false;


    scoreElement.textContent =
      "0";


    /*
      Toon vraag van vandaag
    */

    await loadDailyQuestion();


  }

  catch (error) {

    console.error(
      "Fout bij laden van vragen:",
      error
    );


    alert(
      "De vragen konden niet worden geladen uit de database."
    );

  }

}


/* =========================================
   DAILY QUESTION
========================================= */

function getLocalDateString(
  date = new Date()
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


function getDailyQuestion() {

  if (
    questions.length === 0
  ) {

    return null;

  }


  const startDate =
    new Date(
      2026,
      8,
      1
    );


  const today =
    new Date();


  startDate.setHours(
    0,
    0,
    0,
    0
  );


  today.setHours(
    0,
    0,
    0,
    0
  );


  const differenceInDays =
    Math.floor(
      (
        today -
        startDate
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    );


  const questionIndex =
    (
      differenceInDays %
      questions.length +
      questions.length
    ) %
    questions.length;


  return questions[
    questionIndex
  ];

}


/* =========================================
   CHECK DAILY RESULT
========================================= */

async function checkDailyResult() {

  if (
    !currentUser
  ) {

    return null;

  }


  const today =
    getLocalDateString();


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "quiz_results"
      )
      .select(
        "*"
      )
      .eq(
        "user_id",
        currentUser.id
      )
      .eq(
        "activity_date",
        today
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Fout bij controleren dagelijkse vraag:",
      error
    );

    return null;

  }


  return data;

}


/* =========================================
   LOAD DAILY QUESTION
========================================= */

async function loadDailyQuestion() {

  currentDailyQuestion =
    getDailyQuestion();


  if (
    !currentDailyQuestion
  ) {

    questionElement.textContent =
      "Er zijn nog geen vragen beschikbaar.";


    optionsElement.innerHTML =
      "";


    return;

  }


  selectedAnswer =
    null;


  answered =
    false;


  feedbackElement.classList.add(
    "hidden"
  );


  feedbackElement.classList.remove(
    "correct-feedback",
    "incorrect-feedback"
  );


  submitButton.classList.remove(
    "hidden"
  );


  submitButton.textContent =
    "Indienen →";


  nextButton.classList.add(
    "hidden"
  );


  questionElement.textContent =
    currentDailyQuestion.question;


  categoryElement.textContent =
    currentDailyQuestion.category;


  difficultyElement.textContent =
    currentDailyQuestion.difficulty;


  progressElement.textContent =
    "Vandaag";


  optionsElement.innerHTML =
    "";


  currentDailyQuestion.options.forEach(
    (
      option,
      index
    ) => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.classList.add(
        "option"
      );


      button.innerHTML =
        `
        <span class="option-letter">
          ${String.fromCharCode(
            65 + index
          )}
        </span>

        <span>
          ${option}
        </span>
        `;


      button.addEventListener(
        "click",
        () => {

          selectAnswer(
            index
          );

        }
      );


      optionsElement.appendChild(
        button
      );

    }
  );


  /*
    Controleren of gebruiker
    vandaag al heeft geantwoord
  */

  const dailyResult =
    await checkDailyResult();


  if (
    dailyResult
  ) {

    hasAnsweredToday =
      true;


    selectedAnswer =
      dailyResult.selected_answer;


    answered =
      true;


    showCompletedDailyQuestion(
      dailyResult
    );

  }

  else {

    hasAnsweredToday =
      false;

  }

}


/* =========================================
   SHOW COMPLETED DAILY QUESTION
========================================= */

function showCompletedDailyQuestion(
  dailyResult
) {

  const options =
    document.querySelectorAll(
      ".option"
    );


  options.forEach(
    option => {

      option.disabled =
        true;

    }
  );


  if (
    options[
      currentDailyQuestion.correct
    ]
  ) {

    options[
      currentDailyQuestion.correct
    ].classList.add(
      "correct"
    );

  }


  if (
    !dailyResult.is_correct &&
    options[
      dailyResult.selected_answer
    ]
  ) {

    options[
      dailyResult.selected_answer
    ].classList.add(
      "incorrect"
    );

  }


  feedbackTitle.textContent =
    dailyResult.is_correct
      ? "🎉 Correct!"
      : "Niet helemaal.";


  feedbackText.textContent =
    currentDailyQuestion.explanation;


  feedbackElement.classList.remove(
    "hidden"
  );


  if (
    dailyResult.is_correct
  ) {

    feedbackElement.classList.add(
      "correct-feedback"
    );

  }

  else {

    feedbackElement.classList.add(
      "incorrect-feedback"
    );

  }


  submitButton.classList.add(
    "hidden"
  );


  nextButton.classList.add(
    "hidden"
  );

}


/* =========================================
   UPDATE STREAK
========================================= */

async function updateStreak() {

  if (!currentUser) {
    return;
  }

  const today =
    getLocalDateString();


  /* =========================================
     HUIDIGE VOORTGANG OPHALEN
  ========================================= */

  const {
    data: progress,
    error
  } = await supabaseClient
    .from("user_progress")
    .select("*")
    .eq("user_id", currentUser.id)
    .maybeSingle();


  if (error) {

    console.error(
      "Fout bij ophalen streak:",
      error
    );

    return;
  }


  /* =========================================
     EERSTE DAG
  ========================================= */

  if (!progress) {

    const {
      error: insertError
    } = await supabaseClient
      .from("user_progress")
      .insert({
        user_id: currentUser.id,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today
      });


    if (insertError) {

      console.error(
        "Fout bij starten streak:",
        insertError
      );

      return;
    }


    console.log(
      "Nieuwe streak gestart: 1"
    );

    renderAchievements(1);

    showAchievementToast(
      achievements[0]
    );

    return 1;
  }


  /* =========================================
     VANDAAG AL GEDAAN
  ========================================= */

  if (
    progress.last_activity_date === today
  ) {

    console.log(
      "Streak vandaag al bijgewerkt."
    );

    return;
  }


  /* =========================================
     DATUMVERSCHIL
  ========================================= */

  const lastDateParts =
    progress.last_activity_date
      .split("-")
      .map(Number);

  const todayParts =
    today
      .split("-")
      .map(Number);


  const lastDate = new Date(
    lastDateParts[0],
    lastDateParts[1] - 1,
    lastDateParts[2]
  );

  const todayDate = new Date(
    todayParts[0],
    todayParts[1] - 1,
    todayParts[2]
  );


  const difference =
    Math.round(
      (
        todayDate.getTime() -
        lastDate.getTime()
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    );


  /* =========================================
     NIEUWE STREAK
  ========================================= */

  let newStreak;


  if (difference === 1) {

    newStreak =
      Number(
        progress.current_streak || 0
      ) + 1;

  }

  else {

    newStreak = 1;

  }


  /* =========================================
     LANGSTE STREAK
  ========================================= */

  const newLongestStreak =
    Math.max(
      Number(
        progress.longest_streak || 0
      ),
      newStreak
    );

     const oldLongestStreak =
    Number(
      progress.longest_streak || 0
    );


  /* =========================================
     OPSLAAN
  ========================================= */

  const {
    error: updateError
  } = await supabaseClient
    .from("user_progress")
    .update({
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_activity_date: today
    })
    .eq(
      "user_id",
      currentUser.id
    );


  if (updateError) {

    console.error(
      "Fout bij opslaan streak:",
      updateError
    );

    return;
  }


    console.log(
    "Streak bijgewerkt:",
    newStreak
  );

  renderAchievements(
    newLongestStreak
  );

  checkForNewAchievement(
    oldLongestStreak,
    newLongestStreak
  );

  return newStreak;

}


/* =========================================
   APP STATE
========================================= */

let currentUser = null;

let selectedAnswer = null;

let score = 0;

let answered = false;

let currentDailyQuestion = null;

let hasAnsweredToday = false;


/* =========================================
   CATEGORY HEARTS
========================================= */

function renderCategoryHearts() {

  if (!categoryHeartsElement) {
    return;
  }

  categoryHeartsElement.innerHTML = "";

  for (
    let i = 0;
    i < CATEGORY_MAX_HEARTS;
    i++
  ) {

    const heart =
      document.createElement(
        "span"
      );

    heart.className =
      "category-heart";

    if (
      i < categoryHearts
    ) {

      heart.classList.add(
        "active"
      );

      heart.textContent =
        "❤️";

    }
    else {

      heart.classList.add(
        "empty"
      );

      heart.textContent =
        "🖤";

    }

    categoryHeartsElement.appendChild(
      heart
    );

  }


  if (
    categoryHeartsDescription
  ) {

    if (
      categoryHearts === 0
    ) {

      categoryHeartsDescription.textContent =
        "Je hebt geen hartjes meer. Wacht tot er een hartje terugkomt.";

    }
    else if (
      categoryHearts === 1
    ) {

      categoryHeartsDescription.textContent =
        "Je hebt nog 1 hartje.";

    }
    else {

      categoryHeartsDescription.textContent =
        `Je hebt nog ${categoryHearts} hartjes.`;

    }

  }


  updateCategoryCards();

}


function updateCategoryCards() {

  const cards =
    document.querySelectorAll(
      ".category-card"
    );

  cards.forEach(
    card => {

      card.disabled =
        categoryHearts <= 0;

    }
  );

}


function updateCategoryHeartTimer(updatedAt) {

  if (!categoryHeartsTimer) {
    return;
  }

  if (categoryHearts >= CATEGORY_MAX_HEARTS) {

    categoryHeartsTimer.textContent =
      "❤️ Alle hartjes beschikbaar";

    return;
  }

  if (!updatedAt) {

    categoryHeartsTimer.textContent =
      "❤️ Herstel: —";

    return;
  }

  const updatedTime =
    new Date(updatedAt).getTime();

  const now =
    Date.now();

  const elapsed =
    now - updatedTime;

  const remaining =
    CATEGORY_HEART_REGEN_MS -
    (
      elapsed %
      CATEGORY_HEART_REGEN_MS
    );

  const totalSeconds =
    Math.ceil(
      remaining / 1000
    );

  if (totalSeconds <= 0) {

    categoryHeartsTimer.textContent =
      "❤️ Een hartje komt bijna terug";

    return;
  }

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const seconds =
    totalSeconds % 60;

  categoryHeartsTimer.textContent =
    `❤️ Volgend hartje over ${hours}u ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function startCategoryHeartCountdown(updatedAt) {

  if (categoryHeartTimerInterval) {

    clearInterval(
      categoryHeartTimerInterval
    );

    categoryHeartTimerInterval = null;
  }

  categoryHeartTimerUpdatedAt =
    updatedAt;

  updateCategoryHeartTimer(
    categoryHeartTimerUpdatedAt
  );

  if (
    categoryHearts >=
    CATEGORY_MAX_HEARTS
  ) {
    return;
  }

  categoryHeartTimerInterval =
    setInterval(
      async () => {

        if (
          categoryHearts >=
          CATEGORY_MAX_HEARTS
        ) {

          clearInterval(
            categoryHeartTimerInterval
          );

          categoryHeartTimerInterval =
            null;

          return;
        }

        const updatedTime =
          new Date(
            categoryHeartTimerUpdatedAt
          ).getTime();

        const elapsed =
          Date.now() -
          updatedTime;

        const remaining =
          CATEGORY_HEART_REGEN_MS -
          (
            elapsed %
            CATEGORY_HEART_REGEN_MS
          );

        if (
          remaining <= 1000
        ) {

          clearInterval(
            categoryHeartTimerInterval
          );

          categoryHeartTimerInterval =
            null;

          await loadCategoryHearts();

          return;
        }

        updateCategoryHeartTimer(
          categoryHeartTimerUpdatedAt
        );

      },
      1000
    );
}

let categoryHeartTimerInterval = null;
let categoryHeartTimerUpdatedAt = null;

async function loadCategoryHearts() {

  if (!currentUser) {
    return;
  }


  const {
    data: profile,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "category_hearts, category_hearts_updated_at"
      )
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Fout bij laden categorie-hartjes:",
      error
    );

    return;

  }


  if (!profile) {
    return;
  }


  let hearts =
    Number(
      profile.category_hearts
    );


  if (
    !Number.isFinite(
      hearts
    )
  ) {

    hearts =
      CATEGORY_MAX_HEARTS;

  }


  hearts =
    Math.max(
      0,
      Math.min(
        CATEGORY_MAX_HEARTS,
        hearts
      )
    );


  let updatedAt =
    profile.category_hearts_updated_at;


  /*
    Hartjes herstellen.

    Elk volledig uur komt er
    maximaal één hartje bij.
  */

  if (
    hearts <
    CATEGORY_MAX_HEARTS &&
    updatedAt
  ) {

    const elapsed =
      Date.now() -
      new Date(
        updatedAt
      ).getTime();


    const recoveredHearts =
      Math.floor(
        elapsed /
        CATEGORY_HEART_REGEN_MS
      );


    if (
      recoveredHearts > 0
    ) {

      const newHearts =
        Math.min(
          CATEGORY_MAX_HEARTS,
          hearts +
          recoveredHearts
        );


      const {
        error: updateError
      } =
        await supabaseClient
          .from("profiles")
          .update({

            category_hearts:
              newHearts,

            category_hearts_updated_at:
              newHearts >=
              CATEGORY_MAX_HEARTS
                ? new Date().toISOString()
                : new Date(
                    new Date(
                      updatedAt
                    ).getTime() +
                    recoveredHearts *
                    CATEGORY_HEART_REGEN_MS
                  ).toISOString()

          })
          .eq(
            "id",
            currentUser.id
          );


      if (
        updateError
      ) {

        console.error(
          "Fout bij herstellen categorie-hartjes:",
          updateError
        );

      }
      else {

        hearts =
          newHearts;

        updatedAt =
          newHearts >=
          CATEGORY_MAX_HEARTS
            ? new Date().toISOString()
            : new Date(
                new Date(
                  updatedAt
                ).getTime() +
                recoveredHearts *
                CATEGORY_HEART_REGEN_MS
              ).toISOString();

      }

    }

  }


  categoryHearts =
  hearts;

renderCategoryHearts();

startCategoryHeartCountdown(
  updatedAt
);

}



async function loseCategoryHeart() {

  if (!currentUser) {
    return;
  }


  /*
    Veiligheidscontrole.
  */

  if (
    categoryHearts <= 0
  ) {

    return;

  }


  const newHearts =
    Math.max(
      0,
      categoryHearts - 1
    );


  const {
    error
  } =
    await supabaseClient
      .from("profiles")
      .update({

        category_hearts:
          newHearts,

        category_hearts_updated_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        currentUser.id
      );


  if (error) {

    console.error(
      "Fout bij verliezen categorie-hartje:",
      error
    );

    return;

  }


  categoryHearts =
    newHearts;


  renderCategoryHearts();

  updateCategoryHeartTimer(
    new Date().toISOString()
  );


  if (
    newHearts === 0
  ) {

    alert(
      "Je hebt geen hartjes meer. Er komt ieder uur een nieuw hartje terug."
    );

  }

}

/* =========================================
   CATEGORY QUIZ
========================================= */

let categoryMode = false;

let categoryQuestions = [];

let categoryQuestionIndex = 0;

let categoryHearts = 3;

const CATEGORY_MAX_HEARTS = 3;

const CATEGORY_HEART_REGEN_MS =
  60 * 60 * 1000;


/* =========================================
   DOM ELEMENTS
========================================= */

const authScreen =
  document.getElementById(
    "auth-screen"
  );

const app =
  document.getElementById(
    "app"
  );


/* AUTH */

const loginTab =
  document.getElementById(
    "login-tab"
  );

const registerTab =
  document.getElementById(
    "register-tab"
  );

const loginForm =
  document.getElementById(
    "login-form"
  );

const registerForm =
  document.getElementById(
    "register-form"
  );

const authMessage =
  document.getElementById(
    "auth-message"
  );

const logoutButton =
  document.getElementById(
    "logout-btn"
  );


/* QUIZ */

const questionElement =
  document.getElementById(
    "question"
  );

const optionsElement =
  document.getElementById(
    "options"
  );

const categoryElement =
  document.getElementById(
    "category"
  );

const difficultyElement =
  document.getElementById(
    "difficulty"
  );

const submitButton =
  document.getElementById(
    "submit-btn"
  );

const nextButton =
  document.getElementById(
    "next-btn"
  );

const feedbackElement =
  document.getElementById(
    "feedback"
  );

const feedbackTitle =
  document.getElementById(
    "feedback-title"
  );

const feedbackText =
  document.getElementById(
    "feedback-text"
  );

const scoreElement =
  document.getElementById(
    "score"
  );

const progressElement =
  document.getElementById(
    "progress"
  );


/* PROFILE */

const welcomeText =
  document.getElementById(
    "welcome-text"
  );

const profileName =
  document.getElementById(
    "profile-name"
  );

const profileStudyYear =
  document.getElementById(
    "profile-study-year"
  );

const profileStudyYearSelect =
  document.getElementById("profile-study-year-select");

const saveStudyYearButton =
  document.getElementById("save-study-year-button");

const emailReminderToggle =
  document.getElementById("email-reminder-toggle");

const emailReminderDescription =
  document.getElementById(
    "email-reminder-description"
  );

const profileQuestions =
  document.getElementById(
    "profile-questions"
  );

const profilePercentage =
  document.getElementById(
    "profile-percentage"
  );

const profileStreak =
  document.getElementById(
    "profile-streak"
  );

const streakNumber =
  document.getElementById(
    "streak-number"
  );


/* HINT */

const hintButton =
  document.getElementById(
    "hint-btn"
  );

const hintModal =
  document.getElementById(
    "hint-modal"
  );

const hintText =
  document.getElementById(
    "hint-text"
  );


/* CALCULATOR */

const calculatorButton =
  document.getElementById(
    "calculator-btn"
  );

const calculatorModal =
  document.getElementById(
    "calculator-modal"
  );

const calculatorDisplay =
  document.getElementById(
    "calculator-display"
  );

const openSettingsButton =
  document.getElementById("open-settings-button");

const closeSettingsButton =
  document.getElementById("close-settings-button");

const settingsPanel =
  document.getElementById("settings-panel");

const achievementsGrid =
  document.getElementById("achievements-grid");

const achievementsCount =
  document.getElementById("achievements-count");

const achievementToast =
  document.getElementById("achievement-toast");

const achievementToastIcon =
  document.getElementById("achievement-toast-icon");

const achievementToastTitle =
  document.getElementById("achievement-toast-title");

const achievementToastText =
  document.getElementById("achievement-toast-text");


/* =========================================
   AUTH UI
========================================= */

function showLogin() {

  loginTab.classList.add(
    "active"
  );

  registerTab.classList.remove(
    "active"
  );

  loginForm.classList.remove(
    "hidden"
  );

  registerForm.classList.add(
    "hidden"
  );

  clearAuthMessage();

}


function showRegister() {

  registerTab.classList.add(
    "active"
  );

  loginTab.classList.remove(
    "active"
  );

  registerForm.classList.remove(
    "hidden"
  );

  loginForm.classList.add(
    "hidden"
  );

  clearAuthMessage();

}


function setAuthMessage(
  message,
  type = ""
) {

  authMessage.textContent =
    message;

  authMessage.className =
    `auth-message ${type}`;

}


function clearAuthMessage() {

  authMessage.textContent = "";

  authMessage.className =
    "auth-message";

}


/* =========================================
   REGISTER
========================================= */

async function registerUser(
  event
) {

  event.preventDefault();


  const username =
    document
      .getElementById(
        "register-username"
      )
      .value
      .trim();


  const email =
    document
      .getElementById(
        "register-email"
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        "register-password"
      )
      .value;


  const studyYear =
    document
      .getElementById(
        "register-study-year"
      )
      .value;


  const submit =
    registerForm.querySelector(
      "button[type='submit']"
    );


  submit.disabled = true;

  submit.textContent =
    "Account wordt gemaakt...";


  const {
    data,
    error
  } =
    await supabaseClient.auth.signUp({

      email: email,

      password: password,

      options: {
        emailRedirectTo: "https://d3id4r4.github.io/dailyfarma/",

        data: {
          username: username,
          study_year: studyYear

        }

      }

    });


  if (error) {

    setAuthMessage(
      error.message,
      "error"
    );

    submit.disabled = false;

    submit.textContent =
      "Account maken →";

    return;

  }


  setAuthMessage(
    "Account succesvol aangemaakt! Controleer eventueel je e-mail om je account te bevestigen.",
    "success"
  );


  registerForm.reset();

  submit.disabled = false;

  submit.textContent =
    "Account maken →";


  /*
    Als e-mailbevestiging uitstaat,
    is er direct een sessie.
  */

  if (
    data.session
  ) {

    currentUser =
      data.session.user;


    await loadQuestions();

    await loadCalendar();


    showApp();


    try {

      await loadUserProfile();

    }

    catch (profileError) {

      console.error(
        "Profiel kon niet geladen worden:",
        profileError
      );

    }

  }

}


/* =========================================
   LOGIN
========================================= */

async function loginUser(event) {

  event.preventDefault();

  const email =
    document
      .getElementById(
        "login-email"
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        "login-password"
      )
      .value;


  const submit =
    loginForm.querySelector(
      "button[type='submit']"
    );


  submit.disabled = true;

  submit.textContent =
    "Inloggen...";


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .signInWithPassword({

          email: email,

          password: password

        });


    if (error) {

      throw error;

    }


    currentUser =
  data.user;


/*
  Eerst vragen laden
*/

await loadQuestions();

await loadCalendar();

/*
  Daarna app tonen
*/

showApp();


    /*
      Profiel laden op de achtergrond.
    */

    try {

      await loadUserProfile();

    }

    catch (profileError) {

      console.error(
        "Profiel kon niet geladen worden:",
        profileError
      );

    }


  }

  catch (error) {

    console.error(
      "Login error:",
      error
    );


    setAuthMessage(
      error.message ||
      "Er ging iets mis bij het inloggen.",
      "error"
    );


  }

  finally {

    submit.disabled = false;

    submit.textContent =
      "Inloggen →";

  }

}


/* =========================================
   LOGOUT
========================================= */

async function logoutUser() {

  await supabaseClient.auth.signOut();


  currentUser = null;


  app.classList.add(
    "hidden"
  );


  authScreen.classList.remove(
    "hidden"
  );


  loginForm.reset();

  showLogin();

}


/* =========================================
   LOAD PROFILE
========================================= */

async function loadUserProfile() {

  if (!currentUser) return;


  const {
    data: profile,
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (
    profileError
  ) {

    console.error(
      "Profile error:",
      profileError
    );

    return;

  }


  const username =
    profile.username ||
    currentUser.email;


  welcomeText.textContent =
    `Welkom terug, ${username}! 👋`;


  profileName.textContent =
    username;


  profileStudyYear.textContent =
    profile.study_year ||
    "Farmacie Student";

  if (profileStudyYearSelect) {
  profileStudyYearSelect.value =
    profile.study_year || "";
}

const emailRemindersEnabled =
  profile.email_streak_reminders !== false;

updateEmailReminderUI(
  emailRemindersEnabled
);

await loadUserStatistics();
await loadCategoryHearts();

}

async function updateStudyYear() {
  if (!currentUser) {
    alert("Je bent niet ingelogd.");
    return;
  }

  const studyYear =
    profileStudyYearSelect.value;

  if (!studyYear) {
    alert("Kies eerst je studiejaar.");
    return;
  }

  saveStudyYearButton.disabled = true;
  saveStudyYearButton.textContent =
    "Opslaan...";

  const { error } = await supabaseClient
    .from("profiles")
    .update({
      study_year: studyYear
    })
    .eq("id", currentUser.id);

  if (error) {
    console.error(
      "Fout bij updaten studiejaar:",
      error
    );

    alert(
      "Je studiejaar kon niet worden opgeslagen."
    );
  } else {
    profileStudyYear.textContent =
      studyYear;

    profileStudyYearSelect.value =
      studyYear;

    alert(
      "Je studiejaar is opgeslagen!"
    );
  }

  saveStudyYearButton.disabled = false;
  saveStudyYearButton.textContent =
    "Studiejaar opslaan";
}

async function updateEmailReminderSetting() {

  if (!currentUser) {
    return;
  }

  const currentValue =
    emailReminderToggle.dataset.enabled === "true";

  const newValue =
    !currentValue;

  emailReminderToggle.disabled = true;

  const { error } =
    await supabaseClient
      .from("profiles")
      .update({
        email_streak_reminders: newValue
      })
      .eq(
        "id",
        currentUser.id
      );

  if (error) {

    console.error(
      "Fout bij aanpassen e-mailherinneringen:",
      error
    );

    alert(
      "De instelling kon niet worden aangepast."
    );

    emailReminderToggle.disabled = false;

    return;
  }

  updateEmailReminderUI(
    newValue
  );

  emailReminderToggle.disabled = false;
}


function updateEmailReminderUI(
  enabled
) {

  if (!emailReminderToggle) {
    return;
  }

  emailReminderToggle.dataset.enabled =
    enabled ? "true" : "false";

  if (enabled) {

    emailReminderToggle.textContent =
      "🔔 E-mailherinneringen: Aan";

    if (emailReminderDescription) {
      emailReminderDescription.textContent =
        "Je ontvangt een e-mail wanneer je streak bijna verloopt.";
    }

  } else {

    emailReminderToggle.textContent =
      "🔕 E-mailherinneringen: Uit";

    if (emailReminderDescription) {
      emailReminderDescription.textContent =
        "Je ontvangt geen e-mailherinneringen wanneer je streak bijna verloopt.";
    }

  }
}

/* =========================================
   ACHIEVEMENTS
========================================= */

const achievements = [
  {
    threshold: 1,
    icon: "🌱",
    name: "Eerste stap",
    description: "Je hebt je eerste dag geleerd."
  },
  {
    threshold: 3,
    icon: "🔥",
    name: "3 dagen",
    description: "Je hebt 3 dagen op rij geleerd."
  },
  {
    threshold: 7,
    icon: "🥉",
    name: "7 dagen",
    description: "Je hebt 7 dagen op rij geleerd."
  },
  {
    threshold: 14,
    icon: "🥈",
    name: "14 dagen",
    description: "Je hebt 14 dagen op rij geleerd."
  },
  {
    threshold: 30,
    icon: "🥇",
    name: "30 dagen",
    description: "Je hebt 30 dagen op rij geleerd."
  },
  {
    threshold: 60,
    icon: "💎",
    name: "60 dagen",
    description: "Je hebt 60 dagen op rij geleerd."
  },
  {
    threshold: 100,
    icon: "👑",
    name: "100 dagen",
    description: "Je hebt 100 dagen op rij geleerd."
  }
];


function renderAchievements(longestStreak) {

  if (!achievementsGrid) {
    return;
  }

  const streak =
    Number(longestStreak || 0);

  const unlockedCount =
    achievements.filter(
      achievement =>
        streak >= achievement.threshold
    ).length;

  achievementsCount.textContent =
    `${unlockedCount} / ${achievements.length}`;

  achievementsGrid.innerHTML = "";

  achievements.forEach(
    achievement => {

      const unlocked =
        streak >= achievement.threshold;

      const card =
        document.createElement("div");

      card.className =
        `achievement-item ${
          unlocked
            ? "unlocked"
            : "locked"
        }`;

      card.innerHTML =
        `
        <div class="achievement-icon">
          ${achievement.icon}
        </div>

        <div class="achievement-info">

          <strong>
            ${achievement.name}
          </strong>

          <p>
            ${achievement.description}
          </p>

        </div>

        ${
          unlocked
            ? `<span class="achievement-status">✓</span>`
            : `<span class="achievement-status">🔒</span>`
        }

        `;

      achievementsGrid.appendChild(card);

    }
  );
}


function showAchievementToast(achievement) {

  if (!achievementToast) {
    return;
  }

  achievementToastIcon.textContent =
    achievement.icon;

  achievementToastTitle.textContent =
    achievement.name;

  achievementToastText.textContent =
    achievement.description;

  achievementToast.classList.remove(
    "hidden"
  );

  setTimeout(() => {

    achievementToast.classList.add(
      "hidden"
    );

  }, 4000);
}


function checkForNewAchievement(
  oldLongestStreak,
  newLongestStreak
) {

  const oldStreak =
    Number(oldLongestStreak || 0);

  const newStreak =
    Number(newLongestStreak || 0);

  const newlyUnlocked =
    achievements.find(
      achievement =>
        oldStreak < achievement.threshold &&
        newStreak >= achievement.threshold
    );

  if (newlyUnlocked) {

    showAchievementToast(
      newlyUnlocked
    );

  }
}

/* =========================================
   CHECK STREAK EXPIRATION
========================================= */

async function checkStreakExpiration() {

  if (!currentUser) {
    return null;
  }

  const today =
    getLocalDateString();


  const {
    data: progress,
    error
  } = await supabaseClient
    .from("user_progress")
    .select("*")
    .eq("user_id", currentUser.id)
    .maybeSingle();


  if (error) {

    console.error(
      "Fout bij controleren streak:",
      error
    );

    return null;
  }


  if (!progress) {
    return null;
  }


  if (!progress.last_activity_date) {

    return progress;
  }


  /* =========================================
     DATUMVERSCHIL BEREKENEN
  ========================================= */

  const lastDateParts =
    progress.last_activity_date
      .split("-")
      .map(Number);

  const todayParts =
    today
      .split("-")
      .map(Number);


  const lastDate = new Date(
    lastDateParts[0],
    lastDateParts[1] - 1,
    lastDateParts[2]
  );

  const todayDate = new Date(
    todayParts[0],
    todayParts[1] - 1,
    todayParts[2]
  );


  const difference =
    Math.round(
      (
        todayDate.getTime() -
        lastDate.getTime()
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    );


  /* =========================================
     STREAK VERLOPEN
  ========================================= */

  if (difference >= 2) {

    const {
      error: updateError
    } = await supabaseClient
      .from("user_progress")
      .update({
        current_streak: 0
      })
      .eq(
        "user_id",
        currentUser.id
      );


    if (updateError) {

      console.error(
        "Fout bij resetten streak:",
        updateError
      );

      return progress;
    }


    console.log(
      "Streak verlopen. Current streak is gereset naar 0."
    );


    progress.current_streak = 0;

  }


  return progress;
}

/* =========================================
   LOAD STATISTICS
========================================= */

async function loadUserStatistics() {

  if (!currentUser) return;


  const {
    data: results,
    error
  } =
    await supabaseClient
      .from("quiz_results")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    console.error(
      "Statistics error:",
      error
    );

    return;

  }


  const totalQuestions =
    results.length;


  const correctAnswers =
    results.filter(
      result =>
        result.is_correct
    ).length;


  const percentage =
    totalQuestions > 0
      ? Math.round(
          (
            correctAnswers /
            totalQuestions
          ) * 100
        )
      : 0;


  profileQuestions.textContent =
    totalQuestions;


  profilePercentage.textContent =
    `${percentage}%`;


  const progress =
  await checkStreakExpiration();


if (progress) {

  profileStreak.textContent =
    progress.current_streak;

  streakNumber.textContent =
    progress.current_streak;

  renderAchievements(
    progress.longest_streak
  );

}

else {

  profileStreak.textContent =
    0;

  streakNumber.textContent =
    0;

  renderAchievements(0);

}

}


/* =========================================
   SHOW APP
========================================= */

function showApp() {

  authScreen.classList.add(
    "hidden"
  );

  app.classList.remove(
    "hidden"
  );

}


/* =========================================
   DATE
========================================= */

function updateDate() {

  const datePill =
    document.getElementById(
      "date-pill"
    );


  const today =
    new Date();


  datePill.textContent =
    today.toLocaleDateString(
      "nl-NL",
      {

        weekday: "long",

        day: "numeric",

        month: "long"

      }
    );

}


/* =========================================
   QUIZ
========================================= */

function loadQuestion() {

  if (
  questions.length === 0
) {

  questionElement.textContent =
    "Vragen worden geladen...";


  optionsElement.innerHTML =
    "";


  return;

}


  answered = false;

  selectedAnswer = null;


  const currentQuestion =
    questions[
      currentQuestionIndex
    ];


  questionElement.textContent =
    currentQuestion.question;


  categoryElement.textContent =
    currentQuestion.category;


  difficultyElement.textContent =
    currentQuestion.difficulty;


  progressElement.textContent =
    `${currentQuestionIndex + 1}/${questions.length}`;


  submitButton.classList.remove(
    "hidden"
  );


  submitButton.textContent =
    "Indienen →";


  nextButton.classList.add(
    "hidden"
  );


  feedbackElement.classList.add(
    "hidden"
  );


  feedbackElement.classList.remove(
    "correct-feedback",
    "incorrect-feedback"
  );


  optionsElement.innerHTML =
    "";


  currentQuestion.options.forEach(
    (
      option,
      index
    ) => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.classList.add(
        "option"
      );


      button.innerHTML =
        `
        <span class="option-letter">
          ${String.fromCharCode(65 + index)}
        </span>

        <span>
          ${option}
        </span>
        `;


      button.addEventListener(
        "click",
        () =>
          selectAnswer(
            index
          )
      );


      optionsElement.appendChild(
        button
      );

    }
  );

}


/* =========================================
   SELECT ANSWER
========================================= */

function selectAnswer(
  index
) {

  if (answered) return;


  selectedAnswer =
    index;


  const options =
    document.querySelectorAll(
      ".option"
    );


  options.forEach(
    option =>
      option.classList.remove(
        "selected"
      )
  );


  options[
    index
  ].classList.add(
    "selected"
  );

}


/* =========================================
   SAVE QUIZ RESULT
========================================= */

async function saveQuizResult(
  question,
  isCorrect
) {

  if (
    !currentUser
  ) {

    return false;

  }


  const today =
    getLocalDateString();


  const {
    error
  } =
    await supabaseClient
      .from(
        "quiz_results"
      )
      .insert({

        user_id:
          currentUser.id,

        question_id:
          question.id,

        selected_answer:
          selectedAnswer,

        is_correct:
          isCorrect,

        activity_date:
          categoryMode
          ? null
          : today

      });


  if (error) {

    console.error(
      "Could not save result:",
      error
    );

    return false;

  }


  return true;

}

/* =========================================
   GELUIDEN
========================================= */

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();
  }

  return audioContext;
}


function playTone(
  frequency,
  duration = 0.08,
  type = "sine",
  volume = 0.04
) {

  const context =
    getAudioContext();

  const oscillator =
    context.createOscillator();

  const gain =
    context.createGain();

  oscillator.type =
    type;

  oscillator.frequency.value =
    frequency;

  gain.gain.setValueAtTime(
    volume,
    context.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    context.currentTime +
      duration
  );

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();

  oscillator.stop(
    context.currentTime +
      duration
  );
}


/* Gewone knop */

function playClickSound() {

  playTone(
    520,
    0.06,
    "sine",
    0.035
  );

}


/* Goed antwoord */

function playCorrectSound() {

  playTone(
    523.25,
    0.10,
    "sine",
    0.05
  );

  setTimeout(() => {

    playTone(
      659.25,
      0.12,
      "sine",
      0.05
    );

  }, 80);

  setTimeout(() => {

    playTone(
      783.99,
      0.18,
      "sine",
      0.05
    );

  }, 160);

}


/* Fout antwoord */

function playIncorrectSound() {

  playTone(
    220,
    0.15,
    "sawtooth",
    0.025
  );

}

/* =========================================
   SUBMIT DAILY ANSWER
========================================= */

async function submitAnswer() {

  if (
    selectedAnswer === null
  ) {

    alert(
      "Selecteer eerst een antwoord."
    );

    return;

  }


  if (
    answered ||
    hasAnsweredToday
  ) {
    return;
  }
  
  if (
    !categoryMode &&
    hasAnsweredToday
  ) {
    return;
  }


  answered =
    true;


  const currentQuestion =
    currentDailyQuestion;


  const isCorrect =
    selectedAnswer ===
    currentQuestion.correct;


  const options =
    document.querySelectorAll(
      ".option"
    );


  options.forEach(
    option =>
      option.disabled = true
  );


  options[
    currentQuestion.correct
  ].classList.add(
    "correct"
  );


  if (
    isCorrect
  ) {

    score =
      1;


    scoreElement.textContent =
      "1";


    feedbackTitle.textContent =
      "🎉 Correct!";


    feedbackElement.classList.add(
      "correct-feedback"
    );

    launchConfetti();
    
    playCorrectSound();

  }

  else {

  options[
    selectedAnswer
  ].classList.add(
    "incorrect"
  );


  feedbackTitle.textContent =
    "Niet helemaal.";


  feedbackElement.classList.add(
    "incorrect-feedback"
  );


  playIncorrectSound();


  /*
    In de categoriequiz kost een fout antwoord
    één hartje.
  */

  if (
    categoryMode
  ) {

    await loseCategoryHeart();

  }

}


  feedbackText.textContent =
    currentQuestion.explanation;


  feedbackElement.classList.remove(
    "hidden"
  );


  submitButton.disabled =
    true;


  submitButton.textContent =
    "Opslaan...";


  /*
    RESULTAAT OPSLAAN
  */

  const saved =
    await saveQuizResult(
      currentQuestion,
      isCorrect
    );


  if (
    !saved
  ) {

    alert(
      "Je antwoord kon niet worden opgeslagen. Probeer opnieuw."
    );


    answered =
      false;


    options.forEach(
      option =>
        option.disabled = false
    );


    submitButton.disabled =
      false;


    submitButton.textContent =
      "Indienen →";


    return;

  }


  /*
    STREAK BIJWERKEN
  */
  console.log("TEST: submitAnswer bereikt updateStreak");
  await updateStreak();
  console.log("TEST: updateStreak is uitgevoerd");
  
  await loadCalendar();


  /*
    Vraag is vandaag klaar
  */

  if (categoryMode) {

  submitButton.classList.add(
    "hidden"
  );

  nextButton.classList.remove(
    "hidden"
  );

  }
  else {

  hasAnsweredToday =
    true;

  submitButton.classList.add(
    "hidden"
  );

  nextButton.classList.add(
    "hidden"
  );

  }

  /*
    Statistieken vernieuwen
  */

  await loadUserStatistics();

  await loadCalendar();

}

/* =========================================
   CONFETTI
========================================= */

function launchConfetti() {

  const colors = [
    "#4f7cff",
    "#22c55e",
    "#facc15",
    "#f97316",
    "#ec4899",
    "#a855f7"
  ];

  for (
    let i = 0;
    i < 80;
    i++
  ) {

    const confetti =
      document.createElement(
        "div"
      );

    confetti.classList.add(
      "confetti-piece"
    );

    confetti.style.left =
      Math.random() * 100 + "vw";

    confetti.style.backgroundColor =
      colors[
        Math.floor(
          Math.random() *
          colors.length
        )
      ];

    confetti.style.animationDuration =
      (2 + Math.random() * 2) + "s";

    confetti.style.animationDelay =
      (Math.random() * 0.3) + "s";

    confetti.style.transform =
      `rotate(${Math.random() * 360}deg)`;

    document.body.appendChild(
      confetti
    );

    setTimeout(
      () => {
        confetti.remove();
      },
      4500
    );

  }

}

/* =========================================
   NEXT QUESTION
========================================= */

function nextQuestion() {

  if (categoryMode) {

    if (
      categoryHearts <= 0
    ) {

      finishCategoryQuiz();

      return;

    }

    categoryQuestionIndex++;


    if (
      categoryQuestionIndex <
      categoryQuestions.length
    ) {

      loadCategoryQuestion();

    }
    else {

      finishCategoryQuiz();

    }

    return;
  }


  currentQuestionIndex++;


  if (
    currentQuestionIndex <
    questions.length
  ) {

    loadQuestion();

  }
  else {

    showFinalResult();

  }

}


/* =========================================
   FINAL RESULT
========================================= */

function showFinalResult() {

  questionElement.textContent =
    "Quiz voltooid! 🎉";


  optionsElement.innerHTML =
    `
    <div class="final-result">

      <h3>
        Jouw score
      </h3>

      <p>
        Je hebt
        <strong>${score}</strong>
        van de
        <strong>${questions.length}</strong>
        vragen correct beantwoord.
      </p>

    </div>
    `;


  feedbackElement.classList.add(
    "hidden"
  );


  nextButton.classList.add(
    "hidden"
  );


  submitButton.textContent =
    "Opnieuw beginnen";


  submitButton.classList.remove(
    "hidden"
  );


  submitButton.onclick =
    restartQuiz;

}


/* =========================================
   RESTART QUIZ
========================================= */

function restartQuiz() {

  currentQuestionIndex = 0;

  score = 0;

  selectedAnswer = null;

  answered = false;


  scoreElement.textContent =
    "0";


  submitButton.onclick =
    null;


  loadQuestion();

}


/* =========================================
   HINT
========================================= */

function openHint() {

  if (
    !currentDailyQuestion
  ) {
    return;
  }

  hintText.textContent =
    currentDailyQuestion.hint ||
    "Voor deze vraag is geen hint beschikbaar.";

  hintModal.classList.remove(
    "hidden"
  );

}


function closeHintModal() {

  hintModal.classList.add(
    "hidden"
  );

}


/* =========================================
   CALCULATOR
========================================= */

let calculatorValue =
  "";


function openCalculator() {

  calculatorModal.classList.remove(
    "hidden"
  );

}


function closeCalculatorModal() {

  calculatorModal.classList.add(
    "hidden"
  );

}


document
  .querySelectorAll(
    ".calculator-grid button[data-value]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          calculatorValue +=
            button.dataset.value;


          calculatorDisplay.value =
            calculatorValue;

        }
      );

    }
  );


document
  .getElementById(
    "calculator-equals"
  )
  .addEventListener(
    "click",
    () => {

      try {

        calculatorValue =
          String(
            Function(
              `"use strict"; return (${calculatorValue})`
            )()
          );


        calculatorDisplay.value =
          calculatorValue;

      }

      catch {

        calculatorDisplay.value =
          "Fout";


        calculatorValue =
          "";

      }

    }
  );


document
  .getElementById(
    "calculator-clear"
  )
  .addEventListener(
    "click",
    () => {

      calculatorValue =
        "";


      calculatorDisplay.value =
        "0";

    }
  );


/* =========================================
   CALENDAR
========================================= */

let calendarDate = new Date();

const calendarGrid = document.getElementById("calendar-grid");
const calendarMonth = document.getElementById("calendar-month");
const previousMonthButton = document.getElementById("previous-month");
const nextMonthButton = document.getElementById("next-month");


/* =========================================
   DATUM HULPFUNCTIE
   Gebruikt de lokale datum en voorkomt
   problemen met UTC/tijdzones.
========================================= */

function formatLocalDate(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================
   KALENDER LADEN
========================================= */

async function loadCalendar() {
  console.log("KALENDER WORDT GELADEN");

  if (!currentUser) {
    return;
  }

  /*
    Haal alle beantwoorde vragen
    van deze gebruiker op.
  */

  const {
    data: results,
    error
  } = await supabaseClient
    .from("quiz_results")
    .select("created_at")
    .eq("user_id", currentUser.id);


  if (error) {
    console.error(
      "Calendar error:",
      error
    );

    return;
  }


  renderCalendar(results || []);
}


/* =========================================
   KALENDER TEKENEN
========================================= */

function renderCalendar(results) {
  console.log(
    "KALENDER WORDT GETEKEND",
    results
  );


  /*
    Maak de kalender eerst leeg.
  */

  calendarGrid.innerHTML = "";


  /*
    Maandtitel
    Bijvoorbeeld:
    september 2026
  */

  calendarMonth.textContent =
    calendarDate.toLocaleDateString(
      "nl-NL",
      {
        month: "long",
        year: "numeric"
      }
    );


  /*
    Jaar en maand ophalen.
  */

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();


  /*
    Bepaal op welke weekdag
    de eerste dag van de maand valt.

    JavaScript:
    zondag = 0
    maandag = 1
    dinsdag = 2
    enz.

    Wij willen:
    maandag = 0
    dinsdag = 1
    enz.
  */

  const firstDay =
    new Date(
      year,
      month,
      1
    );


  let startingDay =
    firstDay.getDay() - 1;


  /*
    Als de eerste dag zondag is,
    moet deze op positie 6 komen.
  */

  if (startingDay < 0) {
    startingDay = 6;
  }


  /*
    Bereken hoeveel dagen
    deze maand heeft.
  */

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  /* =========================================
     BEANTWOORDE DATUMS OPSLAAN
  ========================================= */

  const completedDates = new Set();


  results.forEach(result => {

    /*
      Supabase geeft bijvoorbeeld:
      2026-09-05T11:00:00+00:00

      We maken daar een JavaScript
      Date-object van.
    */

    const date =
      new Date(
        result.created_at
      );


    /*
      BELANGRIJK:
      We gebruiken NIET meer toISOString().
      Daardoor voorkomen we het UTC-probleem.
    */

    const dateString =
      formatLocalDate(date);


    completedDates.add(
      dateString
    );

  });


  /* =========================================
     LEGE VAKJES VOOR DE EERSTE DAG
  ========================================= */

  for (
    let i = 0;
    i < startingDay;
    i++
  ) {

    const emptyDay =
      document.createElement(
        "div"
      );

    emptyDay.classList.add(
      "empty-day"
    );

    calendarGrid.appendChild(
      emptyDay
    );
  }


  /* =========================================
     ALLE DAGEN VAN DE MAAND MAKEN
  ========================================= */

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    /*
      Maak de datum van deze dag.
    */

    const date =
      new Date(
        year,
        month,
        day
      );


    /*
      Gebruik opnieuw onze lokale
      datumfunctie.
    */

    const dateString =
      formatLocalDate(date);


    /*
      Maak de knop.
    */

    const dayButton =
      document.createElement(
        "button"
      );


    dayButton.type =
      "button";


    dayButton.classList.add(
      "calendar-day"
    );


    dayButton.textContent =
      day;


    /*
      Als de gebruiker op deze datum
      minimaal één vraag heeft beantwoord,
      krijgt de dag de class "completed".
    */

    if (
      completedDates.has(
        dateString
      )
    ) {

      dayButton.classList.add(
        "completed"
      );

    }


    /*
      Voeg de dag toe aan de kalender.
    */

    calendarGrid.appendChild(
      dayButton
    );

  }
}


/* =========================================
   VORIGE MAAND
========================================= */

if (previousMonthButton) {

  previousMonthButton.addEventListener(
    "click",
    () => {

      calendarDate.setMonth(
        calendarDate.getMonth() - 1
      );

      loadCalendar();

    }
  );

}


/* =========================================
   VOLGENDE MAAND
========================================= */

if (nextMonthButton) {

  nextMonthButton.addEventListener(
    "click",
    () => {

      calendarDate.setMonth(
        calendarDate.getMonth() + 1
      );

      loadCalendar();

    }
  );

}

/* =========================================
   CATEGORY QUIZ
========================================= */
const categoryHeartsElement =
  document.getElementById(
    "category-hearts"
  );

const categoryHeartsDescription =
  document.getElementById(
    "category-hearts-description"
  );

const categoryHeartsTimer =
  document.getElementById(
    "category-hearts-timer"
  );

const categoryCards =
  document.querySelectorAll(
    ".category-card"
  );


categoryCards.forEach(
  categoryCard => {

    categoryCard.addEventListener(
      "click",
      () => {

        const category =
          categoryCard.dataset.category;

        startCategoryQuiz(
          category
        );

      }
    );

  }
);


function startCategoryQuiz(
  category
) {

  if (
    categoryHearts <= 0
  ) {

    alert(
      "Je hebt geen hartjes meer. Er komt ieder uur een nieuw hartje terug."
    );

    return;

  }

  const backToCategoriesButton =
    document.getElementById(
      "back-to-categories-button"
    );

  if (backToCategoriesButton) {
    backToCategoriesButton.classList.remove(
      "hidden"
    );
  }

  const filteredQuestions =
    questions.filter(
      question =>
        question.category === category
    );


  if (
    filteredQuestions.length === 0
  ) {

    alert(
      `Er zijn nog geen vragen beschikbaar voor ${category}.`
    );

    return;
  }


  categoryMode = true;

  categoryQuestions =
    filteredQuestions;

  categoryQuestionIndex = 0;

  score = 0;

  scoreElement.textContent =
    "0";


  /* =========================
     QUIZ NAAR CATEGORIEËN
  ========================= */

  const categoryGrid =
    document.getElementById(
      "category-grid"
    );

  const categoryQuizArea =
    document.getElementById(
      "category-quiz-area"
    );

  const quizCard =
    document.getElementById(
      "quiz-card"
    );

  const scoreInfo =
    document.getElementById(
      "score-info"
    );


  if (
    categoryGrid
  ) {

    categoryGrid.classList.add(
      "hidden"
    );

  }


  if (
    categoryQuizArea &&
    quizCard &&
    scoreInfo
  ) {

    categoryQuizArea.appendChild(
      quizCard
    );

    categoryQuizArea.appendChild(
      scoreInfo
    );

  }


  /* =========================
     CATEGORIEËN PAGINA ACTIEF
  ========================= */

  pages.forEach(
    page =>
      page.classList.remove(
        "active-page"
      )
  );


  document
    .getElementById(
      "categories-page"
    )
    .classList.add(
      "active-page"
    );


  navItems.forEach(
    item =>
      item.classList.remove(
        "active"
      )
  );


  const categoriesNav =
    document.querySelector(
      '[data-page="categories-page"]'
    );


  if (categoriesNav) {

    categoriesNav.classList.add(
      "active"
    );

  }


  loadCategoryQuestion();

  window.scrollTo(
    0,
    0
  );

}


function loadCategoryQuestion() {

  const currentQuestion =
    categoryQuestions[
      categoryQuestionIndex
    ];


  if (!currentQuestion) {

    finishCategoryQuiz();

    return;
  }


  currentDailyQuestion =
    currentQuestion;

  selectedAnswer = null;

  answered = false;

  hasAnsweredToday = false;


  questionElement.textContent =
    currentQuestion.question;


  categoryElement.textContent =
    currentQuestion.category;


  difficultyElement.textContent =
    currentQuestion.difficulty;


  progressElement.textContent =
    `${categoryQuestionIndex + 1}/${categoryQuestions.length}`;


  feedbackElement.classList.add(
    "hidden"
  );

  feedbackElement.classList.remove(
    "correct-feedback",
    "incorrect-feedback"
  );


  submitButton.classList.remove(
    "hidden"
  );

  submitButton.disabled = false;

  submitButton.textContent =
    "Indienen →";


  nextButton.classList.add(
    "hidden"
  );


  optionsElement.innerHTML =
    "";


  currentQuestion.options.forEach(
    (
      option,
      index
    ) => {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.classList.add(
        "option"
      );

      button.innerHTML = `
        <span class="option-letter">
          ${String.fromCharCode(
            65 + index
          )}
        </span>

        <span>
          ${option}
        </span>
      `;


      button.addEventListener(
        "click",
        () => {
          selectAnswer(
            index
          );
        }
      );


      optionsElement.appendChild(
        button
      );

    }
  );

}


function finishCategoryQuiz() {

  questionElement.textContent =
    "Categorie afgerond! 🎉";


  optionsElement.innerHTML = `
    <div class="final-result">

      <h3>
        ${categoryQuestions.length}
        vragen geoefend
      </h3>

      <p>
        Je hebt
        <strong>${score}</strong>
        van de
        <strong>${categoryQuestions.length}</strong>
        vragen correct beantwoord.
      </p>

    </div>
  `;


  feedbackElement.classList.add(
    "hidden"
  );

  submitButton.classList.add(
    "hidden"
  );

  nextButton.classList.add(
    "hidden"
  );

}

function exitCategoryQuiz() {

  categoryMode = false;

  categoryQuestions = [];

  categoryQuestionIndex = 0;

    const backToCategoriesButton =
    document.getElementById(
      "back-to-categories-button"
    );

  if (backToCategoriesButton) {
    backToCategoriesButton.classList.add(
      "hidden"
    );
  }


  const todayQuizArea =
    document.getElementById(
      "today-quiz-area"
    );

  const categoryGrid =
    document.getElementById(
      "category-grid"
    );

  const quizCard =
    document.getElementById(
      "quiz-card"
    );

  const scoreInfo =
    document.getElementById(
      "score-info"
    );


  if (
    todayQuizArea &&
    quizCard &&
    scoreInfo
  ) {

    todayQuizArea.appendChild(
      quizCard
    );

    todayQuizArea.appendChild(
      scoreInfo
    );

  }


  if (categoryGrid) {

    categoryGrid.classList.remove(
      "hidden"
    );

  }

  loadDailyQuestion();

}

/* =========================================
   NAVIGATION
========================================= */

const backToCategoriesButton =
  document.getElementById(
    "back-to-categories-button"
  );


backToCategoriesButton?.addEventListener(
  "click",
  () => {

    exitCategoryQuiz();

  }
);

const navItems =
  document.querySelectorAll(
    ".nav-item"
  );


const pages =
  document.querySelectorAll(
    ".page"
  );


navItems.forEach(
  navItem => {

    navItem.addEventListener(
      "click",
      () => {

        const targetPage =
          navItem.dataset.page;
        
          if (targetPage === "today-page") {

            categoryMode = false;

            categoryQuestions = [];

            categoryQuestionIndex = 0;

            const todayQuizArea =
              document.getElementById(
                "today-quiz-area"
              );

            const categoryGrid =
              document.getElementById(
                "category-grid"
              );

            const quizCard =
              document.getElementById(
                "quiz-card"
              );

            const scoreInfo =
              document.getElementById(
                "score-info"
              );


            if (
              todayQuizArea &&
              quizCard &&
              scoreInfo
            ) {

              todayQuizArea.appendChild(
                quizCard
              );

              todayQuizArea.appendChild(
                scoreInfo
              );

            }


            if (categoryGrid) {

              categoryGrid.classList.remove(
                "hidden"
              );

            }


            const backToCategoriesButton =
              document.getElementById(
                "back-to-categories-button"
              );

            if (backToCategoriesButton) {

              backToCategoriesButton.classList.add(
                "hidden"
              );

            }


            loadDailyQuestion();

          }

        pages.forEach(
          page =>
            page.classList.remove(
              "active-page"
            )
        );


        document
          .getElementById(
            targetPage
          )
          .classList.add(
            "active-page"
          );


        navItems.forEach(
          item =>
            item.classList.remove(
              "active"
            )
        );


        navItem.classList.add(
          "active"
        );


        window.scrollTo(
          0,
          0
        );

      }
    );

  }
);


/* =========================================
   MODAL EVENTS
========================================= */

document
  .getElementById(
    "close-hint"
  )
  .addEventListener(
    "click",
    closeHintModal
  );


document
  .getElementById(
    "hint-close-btn"
  )
  .addEventListener(
    "click",
    closeHintModal
  );


document
  .getElementById(
    "close-calculator"
  )
  .addEventListener(
    "click",
    closeCalculatorModal
  );


hintModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      hintModal
    ) {

      closeHintModal();

    }

  }
);


calculatorModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      calculatorModal
    ) {

      closeCalculatorModal();

    }

  }
);


/* =========================================
   AUTH EVENTS
========================================= */

if (loginTab) {
  loginTab.addEventListener(
    "click",
    () => {
      showLogin();
    }
  );
}


if (registerTab) {
  registerTab.addEventListener(
    "click",
    () => {
      showRegister();
    }
  );
}


loginForm.addEventListener(
  "submit",
  loginUser
);


registerForm.addEventListener(
  "submit",
  registerUser
);


logoutButton.addEventListener(
  "click",
  logoutUser
);

if (saveStudyYearButton) {
  saveStudyYearButton.addEventListener(
    "click",
    updateStudyYear
  );
}

if (emailReminderToggle) {
  emailReminderToggle.addEventListener(
    "click",
    updateEmailReminderSetting
  );
}

openSettingsButton?.addEventListener("click", () => {
  settingsPanel.classList.remove("hidden");
  openSettingsButton.classList.add("hidden");
});

closeSettingsButton?.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
  openSettingsButton.classList.remove("hidden");
});

/* =========================================
   QUIZ EVENTS
========================================= */

submitButton.addEventListener(
  "click",
  () => {

    if (
      submitButton.textContent ===
      "Opnieuw beginnen"
    ) {

      restartQuiz();

      return;

    }


    submitAnswer();

  }
);


nextButton.addEventListener(
  "click",
  nextQuestion
);


hintButton.addEventListener(
  "click",
  openHint
);


calculatorButton.addEventListener(
  "click",
  openCalculator
);


/* =========================================
   CHECK SESSION
========================================= */

async function checkSession() {

  const {
    data
  } =
    await supabaseClient
      .auth
      .getSession();


  const session =
    data.session;

  
  if (
  session
) {

  currentUser =
    session.user;


  /*
    Eerst vragen laden
  */

  await loadQuestions();

  await loadCalendar();


  /*
    Daarna app tonen
  */

  showApp();


  /*
    Profiel laden
  */

  try {

    await loadUserProfile();

  }

  catch (profileError) {

    console.error(
      "Profiel kon niet geladen worden:",
      profileError
    );

  }

}

  else {

    authScreen.classList.remove(
      "hidden"
    );


    app.classList.add(
      "hidden"
    );

  }

}


/* =========================================
   AUTH STATE CHANGES
========================================= */

supabaseClient
  .auth
  .onAuthStateChange(
    async (
      event,
      session
    ) => {

      if (
        event === "SIGNED_OUT"
      ) {

        currentUser =
          null;


        app.classList.add(
          "hidden"
        );


        authScreen.classList.remove(
          "hidden"
        );

      }

    }
  );


/* =========================================
   START APP
========================================= */

updateDate();

checkSession();


/* =========================================
   PROFIEL RESET KNOP
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  const resetProfileButton =
    document.getElementById("reset-profile-button");

  if (!resetProfileButton) {
    console.log("Reset-knop niet gevonden.");
    return;
  }

  resetProfileButton.addEventListener(
    "click",
    async () => {

      if (!currentUser) {
        alert("Je bent niet ingelogd.");
        return;
      }

      const firstConfirmation = confirm(
        "Weet je zeker dat je je profiel wilt resetten?\n\n" +
        "Je quizresultaten, streak en voortgang worden verwijderd."
      );

      if (!firstConfirmation) {
        return;
      }

      const secondConfirmation = confirm(
        "LET OP!\n\n" +
        "Dit verwijdert al je opgeslagen quizvoortgang en je streak.\n\n" +
        "Weet je zeker dat je opnieuw wilt beginnen?"
      );

      if (!secondConfirmation) {
        return;
      }

      try {

        console.log("Profiel wordt gereset...");

        const {
          error: resultsError
        } = await supabaseClient
          .from("quiz_results")
          .delete()
          .eq("user_id", currentUser.id);

        if (resultsError) {
          throw resultsError;
        }

        const {
          error: progressError
        } = await supabaseClient
          .from("user_progress")
          .delete()
          .eq("user_id", currentUser.id);

        if (progressError) {
          throw progressError;
        }

        alert(
          "Je profiel is succesvol gereset!"
        );

        await loadUserStatistics();
        await loadCalendar();

      } catch (error) {

        console.error(
          "Fout bij resetten profiel:",
          error
        );

        alert(
          "Het profiel kon niet worden gereset."
        );
      }
    }
  );

  console.log(
    "Reset-knop succesvol gekoppeld."
  );

});


/* =========================
   DARK MODE
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const themeButton = document.getElementById("theme-btn");

  if (!themeButton) {
    console.log("Theme-knop niet gevonden.");
    return;
  }

  // Controleer of de gebruiker eerder een thema heeft gekozen
  const savedTheme = localStorage.getItem("dailyfarma-theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeButton.textContent = "☀️";
  } else {
    themeButton.textContent = "🌙";
  }

  // Thema wisselen
  themeButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const darkModeActive =
      document.body.classList.contains("dark-mode");

    if (darkModeActive) {
      themeButton.textContent = "☀️";
      localStorage.setItem("dailyfarma-theme", "dark");
    } else {
      themeButton.textContent = "🌙";
      localStorage.setItem("dailyfarma-theme", "light");
    }
  });

  console.log("Dark mode succesvol gekoppeld.");
});

/* =========================================
   BUTTON CLICK SOUND
========================================= */

document.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "button"
      );

    if (!button) {
      return;
    }

    /*
      Deze knoppen hebben al
      hun eigen geluid.
    */
    if (
      button.id === "submit-btn"
    ) {
      return;
    }

    /*
      Antwoordknoppen hebben hun
      eigen interactie.
    */
    if (
      button.classList.contains(
        "option"
      )
    ) {
      return;
    }

    playClickSound();

  }
);