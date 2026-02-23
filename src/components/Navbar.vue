<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-darkest-blue fixed-top">
    <div class="container">
      <router-link class="navbar-brand fw-bold text-new-light" to="/">William Carr</router-link>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <router-link class="nav-link text-light-blue" to="/">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link text-light-blue" to="/experience">Experience</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link text-light-blue" to="/credentials">More Details</router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>