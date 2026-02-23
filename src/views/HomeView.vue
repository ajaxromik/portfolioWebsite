<template>
  <div>
    <section class="min-vh-100 d-flex align-items-center bg-light text-center pt-5">
      <div class="container">
        <div class="row">
          <div class="mx-auto col-12 col-lg-8">
            <h1 class="display-3 fw-bold text-new-dark">Welcome to my Vue SPA, I'm William Carr</h1>
            <h2 class="h4 text-secondary mb-3">Software Engineering Intern, Full-Stack Developer, and Scrum Master</h2>
            <p class="lead text-muted mb-3">Anticipating Graduation May 2026</p>
            <div class="d-flex justify-content-center gap-3">
              <router-link to="/experience" class="btn btn-secondary btn-lg">View My Experience</router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-5 bg-new-light text-new-dark">
      <div class="container text-center">
        <h2 class="mb-4 fw-bold">About Me</h2>
        <div class="row justify-content-center">
          <div class="col-md-8 text-start">
            <p class="fs-5">I work on the Computer Science Department's Web Team at Rowan. I also have some experience with modern AI development tools from my Software Engineering Internship at RunSignUp, where I was involved in full-stack development.</p>
            <p class="fs-5">I have worked various jobs both inside and outside of tech, and I am looking for a job that I could stick with after graduation.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>