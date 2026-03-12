<script setup>
import { Collapse } from 'bootstrap';

const toggleNavMenu = () => {
  const menuEl = document.getElementById('navbarNav');
  const collapseInstance = Collapse.getOrCreateInstance(menuEl);
  collapseInstance.toggle();
};
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-darkest-blue sticky-top">
    <div class="container mw-100">
      <router-link class="navbar-brand fw-bold ps-2" to="/">William Carr</router-link>
      <button class="navbar-toggler" type="button" @click="toggleNavMenu">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/">Home</router-link>
          </li>

          <li class="nav-item dropdown dropdown-hover">
            <a class="nav-link dropdown-toggle" href="#" id="portfolioDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Portfolio
            </a>
            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end bg-darkest-blue border-0 text-end" aria-labelledby="portfolioDropdown">
              <li>
                <router-link class="dropdown-item" to="/projects">Projects</router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/experience">Experience</router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/credentials">More Details</router-link>
              </li>
            </ul>
          </li>

          <li class="nav-item">
            <router-link class="nav-link" to="/flashcards">Flashcards Application</router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Only apply hover effect on desktop (lg breakpoint and up) */
@media all and (min-width: 992px) {
  .dropdown-hover:hover .dropdown-menu {
    display: block;
    min-width: fit-content;
    margin-top: 0; 
  }
  .dropdown-hover .dropdown-menu {
    display: none;
  }
  .dropdown-hover:hover .dropdown-toggle[aria-expanded="false"] {
    color: rgba(255, 255, 255, 0.75);
  }
  /* Prevent clicks on desktop so Bootstrap's JS doesn't get stuck */
  .dropdown-hover > .dropdown-toggle {
    pointer-events: none;
  }
  .dropdown-hover .dropdown-menu-end {
    right: 0;
    left: auto;
  }
}
.dropdown-item {
  background-color: transparent !important;
  color: #778da9; /* Standard inactive text */
}
.dropdown-item:hover,
.dropdown-item:focus {
  background-color: transparent !important;
  color: #f5f5f5 !important; /* Standard hover text */
}
.dropdown-item.router-link-active,
.dropdown-item.active {
  background-color: transparent !important;
  color: #e0e1dd !important; /* Standard active text */
}
</style>