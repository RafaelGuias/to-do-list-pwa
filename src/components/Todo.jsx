import { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from 'prop-types';
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import Webcam from "react-webcam";
import { MapContainer, TileLayer, Marker, Popup as MapPopup } from 'react-leaflet';
import { addPhoto, GetPhotoSrc } from "../db.jsx";
import { CSSTransition } from 'react-transition-group';
import "../Todo.css"; 

function usePrevious(value) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Main Todo Component
export default function Todo(props) {
  const [isEditing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [showMap, setShowMap] = useState(false);

  const editFieldRef = useRef(null);
  const editButtonRef = useRef(null);

  const wasEditing = usePrevious(isEditing);

  function handleChange(event) {
    setNewName(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    props.editTask(props.id, newName);
    setNewName("");
    setEditing(false);
    console.log("Notification for new To-do:", newName);
    showNotification(newName);
  }

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
  };

  const editingTemplate = (
    <form className="stack-small" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="todo-label" htmlFor={props.id}>
          New name for {props.name}
        </label>
        <input
          id={props.id}
          className="todo-text"
          type="text"
          value={newName || props.name}
          onChange={handleChange}
          ref={editFieldRef}
        />
      </div>
      <div className="btn-group">
        <button
          type="button"
          className="btn todo-cancel"
          onClick={() => setEditing(false)}
        >
          Cancel
          <span className="visually-hidden">renaming {props.name}</span>
        </button>
        <button type="submit" className="btn btn__primary todo-edit">
          Save
          <span className="visually-hidden">new name for {props.name}</span>
        </button>
      </div>
    </form>
  );

  const viewTemplate = (
    <div className="stack-small">
      <div className="c-cb">
        <input
          id={props.id}
          type="checkbox"
          defaultChecked={props.completed}
          onChange={() => props.toggleTaskCompleted(props.id)}
        />
        <label className="todo-label" htmlFor={props.id}>
          {props.name}
          {/* Marker for map and weather API */}
          <button onClick={() => setShowMap(true)}>(map)</button>
          &nbsp; | &nbsp;
          <a href={props.location.smsURL}>(sms)</a>
          {props.location.weatherData && (
            <>
              &nbsp; | &nbsp;
              <span>
                {props.location.weatherData.weather[0].description}
                &nbsp;
                {props.location.weatherData.main.temp}°C
              </span>
            </>
          )}
        </label>
      </div>
      <div className="btn-group">
        <button
          type="button"
          className="btn"
          onClick={() => setEditing(true)}
          ref={editButtonRef}
        >
          Edit <span className="visually-hidden">{props.name}</span>
        </button>
        {/* W07 CAM - Popup Take Photo */}
        <Popup
          trigger={<button type="button" className="btn"> Take Photo </button>}
          modal
          onClose={() => { console.log("modal closed "); }}
        >
          {(close) => (
            <div>
              <WebcamCapture id={props.id} photoedTask={props.photoedTask} onClose={close} />
            </div>
          )}
        </Popup>
        {/* W07 CAM - Popup View Photo */}
        <Popup
          trigger={<button type="button" className="btn"> View Photo </button>}
          modal
        >
          {(close) => (
            <div>
              <ViewPhoto id={props.id} alt={props.name} close={close} />
            </div>
          )}
        </Popup>
        {/* IMPROVEMENT - DELETE PHOTO */}
        <button
          type="button"
          className="btn btn__danger"
          onClick={() => props.deletePhoto(props.id)}
        >
          Delete Photo
        </button>
        <button
          type="button"
          className="btn btn__danger"
          onClick={() => props.deleteTask(props.id)}
        >
          Delete task <span className="visually-hidden">{props.name}</span>
        </button>
      </div>
      {showMap && (
        <div className="map-container">
          <MapContainer
            center={[props.location.latitude, props.location.longitude]}
            zoom={13}
            style={{ width: "100%", height: "400px" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[props.location.latitude, props.location.longitude]}>
              <MapPopup>{props.name}</MapPopup>
            </Marker>
          </MapContainer>
          <button onClick={() => setShowMap(false)}>Close Map</button>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    if (!wasEditing && isEditing) {
      editFieldRef.current.focus();
    } else if (wasEditing && !isEditing) {
      editButtonRef.current.focus();
    }
  }, [wasEditing, isEditing]);

  return <li className="todo">{isEditing ? editingTemplate : viewTemplate}</li>;
}

// PropTypes for Todo component
Todo.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  completed: PropTypes.bool.isRequired,
  location: PropTypes.object.isRequired,
  toggleTaskCompleted: PropTypes.func.isRequired,
  photoedTask: PropTypes.func.isRequired,
  deleteTask: PropTypes.func.isRequired,
  editTask: PropTypes.func.isRequired,
  deletePhoto: PropTypes.func.isRequired,
};

// W07 CAM - New Component WebcamCapture
const WebcamCapture = (props) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [imgId, setImgId] = useState(null);
  const [photoSave, setPhotoSave] = useState(false);
  const [showFlashMessage, setShowFlashMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (photoSave) {
      console.log("useEffect detected photoSave");
      props.photoedTask(imgId);
      setPhotoSave(false);
      setShowFlashMessage(true); // Show flash message
      setTimeout(() => setShowFlashMessage(false), 3000); // Hide after 3 seconds
      props.onClose(); // Close the popup after photo is saved
    }
  }, [photoSave, imgId, props]);

  const capture = useCallback(
    (id) => {
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
        console.log("capture", imageSrc.length, id);
      } catch (error) {
        setErrorMessage("Failed to capture photo");
        console.error("Failed to capture photo", error);
      }
    },
    [webcamRef, setImgSrc]
  );

  const savePhoto = (id, imgSrc) => {
    try {
      console.log("savePhoto", imgSrc.length, id);
      addPhoto(id, imgSrc);
      setImgId(id);
      setPhotoSave(true);
    } catch (error) {
      setErrorMessage("Failed to save photo");
      console.error("Failed to save photo", error);
    }
  };

  const cancelPhoto = (id) => {
    console.log("cancelPhoto", id);
    setImgSrc(null);
    props.onClose();
  };

  return (
    <>
      {showFlashMessage && (
        <div className="flash-message">Photo saved!</div>
      )}
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
      {!imgSrc && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          style={{ width: "100%", height: "auto", maxWidth: "500px", maxHeight: "375px" }}
        />
      )}
      {imgSrc && <img src={imgSrc} alt="captured" style={{ width: "100%", height: "auto", maxWidth: "500px", maxHeight: "375px" }} />}
      <div className="btn-group">
        {!imgSrc && (
          <button
            type="button"
            className="btn"
            onClick={() => capture(props.id)}
          >
            Capture photo
          </button>
        )}
        {imgSrc && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => savePhoto(props.id, imgSrc)}
            >
              Save Photo
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setImgSrc(null);
                props.onClose();
              }}
            >
              Close
            </button>
          </>
        )}
        <button
          type="button"
          className="btn todo-cancel"
          onClick={() => cancelPhoto(props.id)}
        >
          Cancel
        </button>
      </div>
    </>
  );
};

// W07 CAM - New Component ViewPhoto
const ViewPhoto = ({ id, alt, close }) => {
  const photoSrc = GetPhotoSrc(id);
  if (!photoSrc) {
    return <div>No photo saved</div>;
  }

  return (
    <>
      <div>
        <img src={photoSrc} alt={alt} style={{ width: "100%", height: "auto", maxWidth: "500px", maxHeight: "375px" }} />
      </div>
      <button
        type="button"
        className="btn"
        onClick={close}
      >
        Close
      </button>
    </>
  );
};

ViewPhoto.propTypes = {
  id: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  close: PropTypes.func.isRequired,
};
