
import React, { useState, useEffect, useRef } from "react";
import Form from "./components/Form";
import FilterButton from "./components/FilterButton";
import Todo from "./components/Todo";
import { nanoid } from "nanoid";
import { db } from "./db";
import axios from 'axios';
import "leaflet/dist/leaflet.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function usePrevious(value) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const FILTER_MAP = {
  All: () => true,
  Active: (task) => !task.completed,
  Completed: (task) => task.completed,
};

const FILTER_NAMES = Object.keys(FILTER_MAP);

export default function App() {

  // Request notification permission when the app loads
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        console.log("Notification permission status:", permission);
        if (permission === "granted") {
          console.log("Notification permission granted.");
        } else {
          console.log("Notification permission denied.");
        }
      });
    } else {
      console.log("Notifications are not supported in this browser.");
    }
  }, []);

  const geoFindMe = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by your browser");
    } else {
      console.log("Locating…");
      navigator.geolocation.getCurrentPosition(success, error);
    }
  };

  const fetchWeatherData = async (latitude, longitude) => {
    try {
      const apiKey = 'cc537ce9f7e6b5c9bfff84cbe8731517';
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
      const response = await axios.get(apiUrl);
      return response.data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  };

  const success = async (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    console.log(latitude, longitude);

    console.log(`Latitude: ${latitude}°, Longitude: ${longitude}°`);
    console.log(
      `Try it here: https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`
    );
    const weatherData = await fetchWeatherData(latitude, longitude);
    if (weatherData) {
      console.log('Weather data:', weatherData);
    }

    locateTask(lastInsertedId, {
      latitude: latitude,
      longitude: longitude,
      error: "",
      mapURL: `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`,
      smsURL: `sms://00447700900xxxx?body=https://maps.google.com/?q=${latitude},${longitude}`,
      weatherData: weatherData,
    });
  };

  const error = () => {
    console.log("Unable to retrieve your location");
  };

  const showNotification = (todoText) => {
    console.log("Checking notification support and permission...");
    if ("Notification" in window) {
      console.log("Notifications are supported.");
      if (Notification.permission === "granted") {
        console.log("Permission is granted. Showing notification.");
        new Notification("New TODO Item", {
          body: `You have added a new TODO: ${todoText}`,
        });
      } else {
        console.log("Notification permission is not granted.");
      }
    } else {
      console.log("Notifications are not supported in this browser.");
    }

    // Also show toast notification for GUI feedback
    toast(`You have added a new TODO: ${todoText}`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  function usePersistedState(key, defaultValue) {
    const [state, setState] = useState(
      () => JSON.parse(localStorage.getItem(key)) || defaultValue
    );
    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);
    return [state, setState];
  }

  const [tasks, setTasks] = usePersistedState("tasks", []);
  const [filter, setFilter] = useState("All");
  const [lastInsertedId, setLastInsertedId] = useState("");

  function toggleTaskCompleted(id) {
    const updatedTasks = tasks.map((task) => {
      if (id === task.id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    setTasks(updatedTasks);
  }

  function deleteTask(id) {
    const remainingTasks = tasks.filter((task) => id !== task.id);
    setTasks(remainingTasks);
  }

  function editTask(id, newName) {
    const editedTaskList = tasks.map((task) => {
      if (id === task.id) {
        return { ...task, name: newName };
      }
      return task;
    });
    setTasks(editedTaskList);
  }

  async function locateTask(id, location) {
    const weatherData = await fetchWeatherData(location.latitude, location.longitude);
    const locatedTaskList = tasks.map((task) => {
      if (id === task.id) {
        return {
          ...task,
          location: {
            ...location,
            mapURL: `https://www.openstreetmap.org/#map=18/${location.latitude}/${location.longitude}&marker=${location.latitude},${location.longitude}`,
            weatherData: weatherData,
          },
        };
      }
      return task;
    });
    setTasks(locatedTaskList);
  }

  function photoedTask(id) {
    const photoedTaskList = tasks.map((task) => {
      if (id === task.id) {
        return { ...task, photo: true };
      }
      return task;
    });
    setTasks(photoedTaskList);
  }

  function deletePhoto(id) {
    const updatedTasks = tasks.map((task) => {
      if (id === task.id) {
        return { ...task, photo: false };
      }
      return task;
    });
    setTasks(updatedTasks);
    db.photos.where("id").equals(id).delete();
  }

  const taskList = tasks?.filter(FILTER_MAP[filter]).map((task) => (
    <Todo
      id={task.id}
      name={task.name}
      completed={task.completed}
      key={task.id}
      location={task.location}
      toggleTaskCompleted={toggleTaskCompleted}
      photoedTask={photoedTask}
      deleteTask={deleteTask}
      editTask={editTask}
      deletePhoto={deletePhoto}
    />
  ));

  const filterList = FILTER_NAMES.map((name) => (
    <FilterButton
      key={name}
      name={name}
      isPressed={name === filter}
      setFilter={setFilter}
    />
  ));

  function addTask(name) {
    const id = "todo-" + nanoid();
    const newTask = {
      id: id,
      name: name,
      completed: false,
      location: { latitude: "##", longitude: "##", error: "##" },
    };
    setLastInsertedId(id);
    setTasks([...tasks, newTask]);
    showNotification(name); 
  }

  const tasksNoun = taskList.length !== 1 ? "tasks" : "task";
  const headingText = `${taskList.length} ${tasksNoun} remaining`;

  const listHeadingRef = useRef(null);
  const prevTaskLength = usePrevious(tasks.length);

  useEffect(() => {
    if (tasks.length < prevTaskLength) {
      listHeadingRef.current.focus();
    }
  }, [tasks.length, prevTaskLength]);

  return (
    <div className="todoapp stack-large">
      <h1>Todo List</h1>
      <Form addTask={addTask} geoFindMe={geoFindMe} />
      <div className="filters btn-group stack-exception">{filterList}</div>
      <h2 id="list-heading" tabIndex="-1" ref={listHeadingRef}>
        {headingText}
      </h2>
      <ul
        aria-labelledby="list-heading"
        className="todo-list stack-large stack-exception"
        role="list"
      >
        {taskList}
      </ul>
      <ToastContainer />
    </div>
  );
}