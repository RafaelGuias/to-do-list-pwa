import { useEffect, useRef, useState, useCallback } from "react";
import Popup from "reactjs-popup"; 
import "reactjs-popup/dist/index.css"; 
import Webcam from "react-webcam"; 
import { addPhoto, GetPhotoSrc } from "../db.jsx"; 
import { CSSTransition } from 'react-transition-group';

function usePrevious(value) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Main Todo Component ----
export default function Todo(props){
  const [isEditing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");

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
  }

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

          {/*marker for map and weather API*/}
          <a href={`${props.location.mapURL}&marker=${props.location.latitude},${props.location.longitude}`}>(map)</a>
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
          onClick={() => {
            setEditing(true);
          }}
          ref={editButtonRef}
        >
          Edit <span className="visually-hidden">{props.name}</span>
        </button>
        {/*W07 CAM - Popup Take Photo*/}
        <Popup
          trigger={
            <button type="button" className="btn">
                 {" "}
                 Take Photo{" "}
                </button>
             }
             modal
             onClose={() => {
               console.log("modal closed ");}}
              >
             {(close) => (
             <div>
               <WebcamCapture id={props.id} photoedTask={props.photoedTask} onClose={close} />
            </div>
  )}
</Popup>
        {/*W07 CAM - Popup View Photo*/}
        <Popup
  trigger={
    <button type="button" className="btn">
      {" "}
      View Photo{" "}
    </button>
  }
  modal
>
  {(close) => (
    <div>
      <ViewPhoto id={props.id} alt={props.name} close={close} />
    </div>
  )}
</Popup>
        {/*IMPROVEMENT------- DELETE PHOTO */}
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

// W07 CAM - New Component WebcamCapture
//
const WebcamCapture = (props) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [imgId, setImgId] = useState(null);
  const [photoSave, setPhotoSave] = useState(false);
  const [showFlashMessage, setShowFlashMessage] = useState(false);

  useEffect(() => {
    if (photoSave) {
      console.log("useEffect detected photoSave");
      props.photoedTask(imgId);
      setPhotoSave(false);
      setShowFlashMessage(true); // Show flash message
      setTimeout(() => setShowFlashMessage(false), 3000); // Hide after 3 seconds
      props.onClose(); //close the popup after photo is saved
    }
  }, [photoSave,imgId ,props]);

  console.log("WebCamCapture", props.id);
  const capture = useCallback(
    (id) => {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      console.log("capture", imageSrc.length, id);
    },
    [webcamRef, setImgSrc]
  );

  const savePhoto =  (id, imgSrc) => {
    console.log("savePhoto", imgSrc.length, id);
     addPhoto(id, imgSrc);
    setImgId(id);
    setPhotoSave(true);
  };

  const cancelPhoto = (id) => {
    console.log("cancelPhoto", id);
    setImgSrc(null);
    props.onClose();
  };

  return (
    <>
    {/**flash messages*/}
      {showFlashMessage && (
      <div className="flash-message">Photo saved!</div>
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
//
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

