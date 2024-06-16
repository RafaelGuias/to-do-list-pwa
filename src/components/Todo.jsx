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

          {/*marker for map and wheather API---------------------------------------------------------------------------------*/}
          <a href={`${props.location.mapURL}&marker=${props.location.latitude},${props.location.longitude}`}>(map)</a> {/*W07 CAM - improvement*/}
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
        {/*IMPROVMENT------- DELETE PHOTO */}

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
      props.onClose(); //close the popup after photo is saved---------------------
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
//-------------------------------------------------------------
  const savePhoto =  (id, imgSrc) => {
    console.log("savePhoto", imgSrc.length, id);
     addPhoto(id, imgSrc);
    setImgId(id);
    setPhotoSave(true);
  };
  // -----------------------------------------------------


  const cancelPhoto = (id, imgSrc) => {
    console.log("cancelPhoto", imgSrc.length, id);
  };

  return (
    <>
    {/**flash messages-------------------------------------------------------- */}
      {showFlashMessage && (
      <div className="flash-message">Photo saved! </div>
      )}
      {!imgSrc && (
        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
      )}
      {imgSrc && <img src={imgSrc} alt= "captured"/>}
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
            close();
          }}
        >
          Close
        </button>
      </>
    )}
        <button
          type="button"
          className="btn todo-cancel"
          onClick={() => cancelPhoto(props.id, imgSrc)}
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
        <img src={photoSrc} alt={alt} />
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


































// import { useEffect, useRef, useState, useCallback } from "react";
// import Popup from "reactjs-popup";
// import "reactjs-popup/dist/index.css"; 
// import Webcam from "react-webcam"; 
// import { addPhoto, GetPhotoSrc } from "../db.jsx"; 

// function usePrevious(value) {
//   const ref = useRef(null);
//   useEffect(() => {
//     ref.current = value;
//   });
//   return ref.current;
// }


// export default function Todo(props) {
//   const [isEditing, setEditing] = useState(false);
//   const [newName, setNewName] = useState("");

//   const editFieldRef = useRef(null);
//   const editButtonRef = useRef(null);

//   const wasEditing = usePrevious(isEditing);

//   function handleChange(event) {
//     setNewName(event.target.value);
//   }

//   function handleSubmit(event) {
//     event.preventDefault();
//     props.editTask(props.id, newName);
//     setNewName("");
//     setEditing(false);
//   }

//   const editingTemplate = (
//     <form className="stack-small" onSubmit={handleSubmit}>
//       <div className="form-group">
//         <label className="todo-label" htmlFor={props.id}>
//           New name for {props.name}
//         </label>
//         <input
//           id={props.id}
//           className="todo-text"
//           type="text"
//           value={newName || props.name}
//           onChange={handleChange}
//           ref={editFieldRef}
//         />
//       </div>
//       <div className="btn-group">
//         <button
//           type="button"
//           className="btn todo-cancel"
//           onClick={() => setEditing(false)}
//         >
//           Cancel
//           <span className="visually-hidden">renaming {props.name}</span>
//         </button>
//         <button type="submit" className="btn btn__primary todo-edit">
//           Save
//           <span className="visually-hidden">new name for {props.name}</span>
//         </button>
//       </div>
//     </form>
//   );

//   const viewTemplate = (
//     <div className="stack-small">
//       <div className="c-cb">
//         <input
//           id={props.id}
//           type="checkbox"
//           defaultChecked={props.completed}
//           onChange={() => props.toggleTaskCompleted(props.id)}
//         />
//         <label className="todo-label" htmlFor={props.id}>
//           {props.name}
//           <a href={props.location.mapURL}>(map)</a> 
//           &nbsp; | &nbsp;
//           <a href={props.location.smsURL}>(sms)</a> 
//         </label>
//       </div>
//       <div className="btn-group">
//         <button
//           type="button"
//           className="btn"
//           onClick={() => {
//             setEditing(true);
//           }}
//           ref={editButtonRef}
//         >
//           Edit <span className="visually-hidden">{props.name}</span>
//         </button>
//         <Popup
//           trigger={
//             <button type="button" className="btn">
//               {" "}
//               Take Photo{" "}
//             </button>
//           }
//           modal
//         >
//           <div>
//             <WebcamCapture id={props.id} photoedTask={props.photoedTask} />
//           </div>
//         </Popup>
  
//         <Popup
//           trigger={
//             <button type="button" className="btn">
//               {" "}
//               View Photo{" "}
//             </button>
//           }
//           modal
//         >
//           <div>
//             <ViewPhoto id={props.id} alt={props.name} />
//           </div>
//         </Popup>
//         <button
//           type="button"
//           className="btn btn__danger"
//           onClick={() => props.deleteTask(props.id)}
//         >
//           Delete <span className="visually-hidden">{props.name}</span>
//         </button>
//       </div>
//     </div>
//   );

//   useEffect(() => {
//     if (!wasEditing && isEditing) {
//       editFieldRef.current.focus();
//     } else if (wasEditing && !isEditing) {
//       editButtonRef.current.focus();
//     }
//   }, [wasEditing, isEditing]);

//   return <li className="todo">{isEditing ? editingTemplate : viewTemplate}</li>;
// }


// const WebcamCapture = (props) => {
//   const webcamRef = useRef(null);
//   const [imgSrc, setImgSrc] = useState(null);
//   const [imgId, setImgId] = useState(null);
//   const [photoSave, setPhotoSave] = useState(false);

//   useEffect(() => {
//     if (photoSave) {
//       console.log("useEffect detected photoSave");
//       props.photoedTask(imgId);
//       setPhotoSave(false);
//     }
//   });
//   console.log("WebCamCapture", props.id);
//   const capture = useCallback(
//     (id) => {
//       const imageSrc = webcamRef.current.getScreenshot();
//       setImgSrc(imageSrc);
//       console.log("capture", imageSrc.length, id);
//     },
//     [webcamRef, setImgSrc]
//   );

//   const savePhoto = (id, imgSrc) => {
//     console.log("savePhoto", imgSrc.length, id);
//     addPhoto(id, imgSrc);
//     setImgId(id);
//     setPhotoSave(true);
//   };

//   const cancelPhoto = (id, imgSrc) => {
//     console.log("cancelPhoto", imgSrc.length, id);
//   };

//   return (
//     <>
//       {!imgSrc && (
//         <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
//       )}
//       {imgSrc && <img src={imgSrc} />}
//       <div className="btn-group">
//         {!imgSrc && (
//           <button
//             type="button"
//             className="btn"
//             onClick={() => capture(props.id)}
//           >
//             Capture photo
//           </button>
//         )}
//         {imgSrc && (
//           <button
//             type="button"
//             className="btn"
//             onClick={() => savePhoto(props.id, imgSrc)}
//           >
//             Save Photo
//           </button>
//         )}
//         <button
//           type="button"
//           className="btn todo-cancel"
//           onClick={() => cancelPhoto(props.id, imgSrc)}
//         >
//           Cancel
//         </button>
//       </div>
//     </>
//   );
// };


// const ViewPhoto = (props) => {
//   const photoSrc = GetPhotoSrc(props.id);
//   return (
//     <>
//       <div>
//         <img src={photoSrc} alt={props.name} />
//       </div>
//     </>
//   );
// };



//section 2

// import { useEffect, useRef, useState, useCallback } from "react";
// import Popup from "reactjs-popup";
// import "reactjs-popup/dist/index.css";
// import Webcam from "react-webcam";
// import { addPhoto, GetPhotoSrc } from "../db.jsx";
// import PropTypes from 'prop-types';

// function usePrevious(value) {
//   const ref = useRef(null);
//   useEffect(() => {
//     ref.current = value;
//   });
//   return ref.current;
// }

// export default function Todo(props) {
//   const [isEditing, setEditing] = useState(false);
//   const [newName, setNewName] = useState("");

//   const editFieldRef = useRef(null);
//   const editButtonRef = useRef(null);

//   const wasEditing = usePrevious(isEditing);

//   function handleChange(event) {
//     setNewName(event.target.value);
//   }

//   function handleSubmit(event) {
//     event.preventDefault();
//     props.editTask(props.id, newName);
//     setNewName("");
//     setEditing(false);
//   }

//   const editingTemplate = (
//     <form className="stack-small" onSubmit={handleSubmit}>
//       <div className="form-group">
//         <label className="todo-label" htmlFor={props.id}>
//           New name for {props.name}
//         </label>
//         <input
//           id={props.id}
//           className="todo-text"
//           type="text"
//           value={newName || props.name}
//           onChange={handleChange}
//           ref={editFieldRef}
//         />
//       </div>
//       <div className="btn-group">
//         <button
//           type="button"
//           className="btn todo-cancel"
//           onClick={() => setEditing(false)}
//         >
//           Cancel
//           <span className="visually-hidden">renaming {props.name}</span>
//         </button>
//         <button type="submit" className="btn btn__primary todo-edit">
//           Save
//           <span className="visually-hidden">new name for {props.name}</span>
//         </button>
//       </div>
//     </form>
//   );

//   const viewTemplate = (
//     <div className="stack-small">
//       <div className="c-cb">
//         <input
//           id={props.id}
//           type="checkbox"
//           defaultChecked={props.completed}
//           onChange={() => props.toggleTaskCompleted(props.id)}
//         />
//         <label className="todo-label" htmlFor={props.id}>
//           {props.name}
//           {props.location && (
//             <>
//               <a href={props.location.mapURL}>(map)</a>
//               &nbsp; | &nbsp;
//               <a href={props.location.smsURL}>(sms)</a>
//             </>
//           )}
//         </label>
//       </div>
//       <div className="btn-group">
//         <button
//           type="button"
//           className="btn"
//           onClick={() => {
//             setEditing(true);
//           }}
//           ref={editButtonRef}
//         >
//           Edit <span className="visually-hidden">{props.name}</span>
//         </button>
//         <Popup
//           trigger={
//             <button type="button" className="btn">
//               {" "}
//               Take Photo{" "}
//             </button>
//           }
//           modal
//           closeOnDocumentClick
//         >
//           <div>
//             <WebcamCapture id={props.id} 
//                             photoedTask={props.photoedTask}
//                             onClose={close} />
//           </div>
//         </Popup>

//         <Popup
//           trigger={
//             <button type="button" className="btn">
//               {" "}
//               View Photo{" "}
//             </button>
//           }
//           modal
//         >
//           <div>
//             <ViewPhoto id={props.id} alt={props.name} />
//           </div>
//         </Popup>
//         <button
//           type="button"
//           className="btn btn__danger"
//           onClick={() => props.deleteTask(props.id)}
//         >
//           Delete <span className="visually-hidden">{props.name}</span>
//         </button>
//       </div>
//     </div>
//   );

//   useEffect(() => {
//     if (!wasEditing && isEditing) {
//       editFieldRef.current.focus();
//     } else if (wasEditing && !isEditing) {
//       editButtonRef.current.focus();
//     }
//   }, [wasEditing, isEditing]);

//   return <li className="todo">{isEditing ? editingTemplate : viewTemplate}</li>;
// }

// Todo.propTypes = {
//   id: PropTypes.string.isRequired,
//   name: PropTypes.string.isRequired,
//   completed: PropTypes.bool.isRequired,
//   toggleTaskCompleted: PropTypes.func.isRequired,
//   deleteTask: PropTypes.func.isRequired,
//   editTask: PropTypes.func.isRequired,
//   photoedTask: PropTypes.func.isRequired,
//   location: PropTypes.shape({
//     mapURL: PropTypes.string,
//     smsURL: PropTypes.string,
//   }),
// };

// const WebcamCapture = (props) => {
//   const webcamRef = useRef(null);
//   const [imgSrc, setImgSrc] = useState(null);
//   const [imgId, setImgId] = useState(null);
//   const [photoSave, setPhotoSave] = useState(false);

//   useEffect(() => {
//     if (photoSave) {
//       console.log("useEffect detected photoSave");
//       props.photoedTask(imgId);
//       setPhotoSave(false);
//     }
//   }, [photoSave, imgId, props]);

//   console.log("WebCamCapture", props.id);
//   const capture = useCallback(
//     (id) => {
//       const imageSrc = webcamRef.current.getScreenshot();
//       setImgSrc(imageSrc);
//       console.log("capture", imageSrc.length, id);
//     },
//     [webcamRef, setImgSrc]
//   );

//   const savePhoto = (id, imgSrc) => {
//     console.log("savePhoto", imgSrc.length, id);
//     addPhoto(id, imgSrc);
//     setImgId(id);
//     setPhotoSave(true);
//   };

//   const cancelPhoto = (id, imgSrc) => {
//     console.log("cancelPhoto", imgSrc.length, id);
//   };

//   return (
//     <>
//       {!imgSrc && (
//         <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
//       )}
//       {imgSrc && <img src={imgSrc} alt="Captured" />}
//       <div className="btn-group">
//         {!imgSrc && (
//           <button
//             type="button"
//             className="btn"
//             onClick={() => capture(props.id)}
//           >
//             Capture photo
//           </button>
//         )}
//         {imgSrc && (
//           <button
//             type="button"
//             className="btn"
//             onClick={() => savePhoto(props.id, imgSrc)}
//           >
//             Save Photo
//           </button>
//         )}
//         <button
//           type="button"
//           className="btn todo-cancel"
//           onClick={() => cancelPhoto(props.id, imgSrc)}
//         >
//           Cancel
//         </button>
//       </div>
//     </>
//   );
// };

// WebcamCapture.propTypes = {
//   id: PropTypes.string.isRequired,
//   photoedTask: PropTypes.func.isRequired,
// };

// const ViewPhoto = (props) => {
//   const photoSrc = GetPhotoSrc(props.id);
//   return (
//     <>
//       <div>
//         {photoSrc ? (
//           <img src={photoSrc} alt={props.name} />
//         ) : (
//           <p>No photo available</p>
//         )}
//       </div>
//     </>
//   );
// };

// ViewPhoto.propTypes = {
//   id: PropTypes.string.isRequired,
//   alt: PropTypes.string,
// };

