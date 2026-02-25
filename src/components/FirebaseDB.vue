<script setup>
import ContactForm from './ContactForm.vue';
import ContactOutputs from './ContactOutputs.vue';
import { ref, onMounted, onUnmounted } from 'vue';
import { db } from '../firebase'; // Import the initialized Firestore instance
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

const newTask = ref('');
const tasks = ref([]);
let unsubscribe = null; // To store the unsubscribe function for real-time listener

const addTask = async () => {
  if (newTask.value.trim()) {
    try {
      await addDoc(collection(db, 'tasks'), {
        name: newTask.value.trim(),
        createdAt: new Date(),
      });
      newTask.value = '';
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
};

onMounted(() => {
  // Set up real-time listener for tasks
  const tasksCollectionRef = collection(db, 'tasks');
  const q = query(tasksCollectionRef, orderBy('createdAt', 'desc'));

  unsubscribe = onSnapshot(q, (snapshot) => {
    const tasksArray = [];
    snapshot.forEach((doc) => {
      tasksArray.push({ id: doc.id, ...doc.data() });
    });
    tasks.value = tasksArray;
  }, (error) => {
    console.error("Error fetching tasks: ", error);
  });
});

onUnmounted(() => {
  // Unsubscribe from real-time listener when component is unmounted
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<template>
  <div class="bg-new-light text-new-dark flex-grow-1 d-flex flex-column">
    <p class="py-4"></p>
    <div class="my-auto flex-grow-1 d-flex flex-column">
        <div class="flex-grow-1 d-flex flex-column align-items-center">
            <h2>Cloud Firestore Tasks</h2>
            <div>
                <form @submit.prevent="addTask">
                  <input type="text" v-model="newTask" placeholder="Add a new task" required />
                  <button type="submit">Add Task</button>
                </form>
                <ul>
                  <li v-for="task in tasks" :key="task.id">
                    {{ task.name }}
                  </li>
                </ul>
            </div>
        </div>
        <hr class="container-sm">
        <div class="container flex-grow-1 d-flex gap-3 justify-content-center">
            <ContactForm />
            <ContactOutputs class="flex-grow-1" />
        </div>
    </div>
  </div>
</template>