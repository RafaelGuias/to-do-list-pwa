import { useState, useRef, useEffect } from "react";
import Form from "./components/Form";
import FilterButton from "./components/FilterButton";
import Todo from "./components/Todo";
import { nanoid } from "nanoid";
import { db } from "./db";
import axios from 'axios';

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

export default function App(props) {
  const geoFindMe = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by your browser");
    } else {
      console.log("Locating…");
      navigator.geolocation.getCurrentPosition(success, error);
    }
  };
    // wheather API---------------------------------------------------
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




  const success = (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    console.log(latitude, longitude);

    console.log(`Latitude: ${latitude}°, Longitude: ${longitude}°`);
    console.log(
      `Try it here: https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`
    );
    locateTask(lastInsertedId, {
      latitude: latitude,
      longitude: longitude,
      error: "",
      mapURL: `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`, // W07 CAM
      smsURL: `sms://00447700900xxxx?body=https://maps.google.com/?q=${latitude},${longitude}`, // W07 CAM
    });
  };

  const error = () => {
    console.log("Unable to retrieve your location");
  };
    // persited state---------------------------------------------------
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
      // if this task has the same ID as the edited task
      if (id === task.id) {
        // use object spread to make a new obkect
        // whose `completed` prop has been inverted
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
      // if this task has the same ID as the edited task
      if (id === task.id) {
        return { ...task, name: newName }; // Copy the task and update its name
      }
      return task; // Return the original task if it's not the edited task
    });
    setTasks(editedTaskList);
  }

  async function locateTask(id, location) {
    console.log("locate Task", id, " before");
    console.log(location, tasks);
    const weatherData = await fetchWeatherData(location.latitude, location.longitude);
    const locatedTaskList = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        // part of the marker on the app---------------------------------------------
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
    console.log(locatedTaskList);
    setTasks(locatedTaskList);
  }

  // W07 CAM - NEW FUNCTION
  function photoedTask(id) {
    console.log("photoedTask", id);
    const photoedTaskList = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        //
        return { ...task, photo: true };
      }
      return task;
    });
    console.log(photoedTaskList);
    setTasks(photoedTaskList);
  }

  // IMPROVEMENT THE DELETE PHOTO FUNCTION!----------------------------
  function deletePhoto(id) {
    const updatedTasks = tasks.map((task) => {
      if (id === task.id) {
        return { ...task, photo: false };
      }
      return task;
    });
    setTasks(updatedTasks);
    // Delete the photo from the database
    db.photos.where("id").equals(id).delete();
  }



  const taskList = tasks?.filter(FILTER_MAP[filter]).map((task) => (
    <Todo
      id={task.id}
      name={task.name}
      completed={task.completed}
      key={task.id}
      location={task.location} // W07 IMPROVEMENT
      toggleTaskCompleted={toggleTaskCompleted}
      photoedTask={photoedTask} // W07 CAM
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
  }

  const tasksNoun = taskList.length !== 1 ? "tasks" : "task";
  const headingText = `${taskList.length} ${tasksNoun} remaining`;

  const listHeadingRef = useRef(null);
  const prevTaskLength = usePrevious(tasks.length);

  useEffect(() => {
    if (tasks.length < prevTaskLength === -1) {
      listHeadingRef.current.focus();
    }
  }, [tasks.length, prevTaskLength]);

  return (
    <div className="todoapp stack-large">
      <h1>Rafa's to do list</h1>
      <Form addTask={addTask} geoFindMe={geoFindMe} />{" "}
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
    </div>
  );
}

