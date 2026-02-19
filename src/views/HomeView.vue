<template>
  <div>
    <section class="min-vh-100 d-flex align-items-center text-center pt-5">
      <div class="container">
        <h1 class="display-3 fw-bold text-dark">[Your Name]</h1>
        <h2 class="h4 text-secondary mb-3">Computer Science Student | Full-Stack Developer | SWE Intern</h2>
        <p class="lead text-muted mb-4">Graduating May 2026</p>
        <p class="col-lg-8 mx-auto fs-5 mb-4">
          Building scalable, user-centric applications by bridging the gap between clean backend architecture and intuitive frontend design.
        </p>
        <div class="d-flex justify-content-center flex-wrap gap-2 mb-4">
          <span class="badge bg-secondary fs-6 px-3 py-2">4 Years Full-Stack Experience</span>
          <span class="badge bg-secondary fs-6 px-3 py-2">Full-Time SWE Internship</span>
          <span class="badge bg-secondary fs-6 px-3 py-2">React Native & D3.js</span>
        </div>
        <div class="d-flex justify-content-center gap-3">
          <router-link to="/work" class="btn btn-primary btn-lg">View My Work</router-link>
        </div>
      </div>
    </section>

    <section class="py-5 bg-light">
      <div class="container text-center">
        <h2 class="mb-4 fw-bold">About Me</h2>
        <div class="row justify-content-center">
          <div class="col-md-8 text-start">
            <p class="fs-5">I am a Software Engineering student at [University Name], pursuing my B.S. in Computer Science with a career focus on Backend and Full-Stack roles. I thrive on creating scalable systems using clean, MVC architecture.</p>
            <p class="fs-5">For the past four years, I have successfully balanced a rigorous academic schedule with a part-time Full-Stack Developer position. This dual track has instilled in me a strong engineering philosophy: write maintainable code, design robust databases, and always prioritize the end-user experience.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>