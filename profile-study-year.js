/* =========================================
   STUDIEJAAR AANPASSEN IN PROFIEL
========================================= */

function setupStudyYearEditor() {

  const profileStudyYear =
    document.getElementById("profile-study-year");

  const profileStudyYearSelect =
    document.getElementById("profile-study-year-select");

  const saveStudyYearButton =
    document.getElementById("save-study-year-button");

  if (
    !profileStudyYear ||
    !profileStudyYearSelect ||
    !saveStudyYearButton
  ) {
    return;
  }

  profileStudyYearSelect.value =
    profileStudyYear.textContent.trim();

  saveStudyYearButton.addEventListener(
    "click",
    async () => {

      if (!window.currentUser) {
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
      saveStudyYearButton.textContent = "Opslaan...";

      const { error } =
        await window.supabaseClient
          .from("profiles")
          .update({
            study_year: studyYear
          })
          .eq("id", window.currentUser.id);

      if (error) {
        console.error(
          "Fout bij updaten studiejaar:",
          error
        );

        alert(
          "Je studiejaar kon niet worden opgeslagen."
        );
      } else {
        profileStudyYear.textContent = studyYear;
        alert("Je studiejaar is opgeslagen!");
      }

      saveStudyYearButton.disabled = false;
      saveStudyYearButton.textContent =
        "Studiejaar opslaan";
    }
  );
}

document.addEventListener(
  "DOMContentLoaded",
  setupStudyYearEditor
);
