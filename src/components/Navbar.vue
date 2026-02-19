<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top shadow-sm">
    <div class="container">
      <router-link class="navbar-brand fw-bold" to="/">[Your Name]</router-link>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/">Home & About</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/work">Work & Projects</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/resume">Education & Resume</router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>