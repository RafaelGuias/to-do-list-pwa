// import Dexie from "dexie";
// import { useLiveQuery } from "dexie-react-hooks";

// export const db = new Dexie("todo-photos");

// db.version(1).stores({
//   photos: "id", 
// });

// async function addPhoto(id, imgSrc) {
//   console.log("addPhoto", imgSrc.length, id);
//   try {
   
//     const i = await db.photos.add({
//       id: id,
//       imgSrc: imgSrc,
//     });
//     console.log(`Photo ${imgSrc.length} bytes successfully added. Got id ${i}`);
//   } catch (error) {
//     console.log(`Failed to add photo: ${error}`);
//   }
//   return (
//     <>
//       <p>
//         {imgSrc.length} &nbsp; | &nbsp; {id}
//       </p>
//     </>
//   );
// }


// function GetPhotoSrc(id) {
//     console.log("getPhotoSrc", id);
//     const img = useLiveQuery(() => db.photos.where("id").equals(id).toArray());
//     console.table(img);
//     if (Array.isArray(img)) return img[0].imgSrc; // 6 à Return data string for image
//     } // identified by id. This function very ugly!
//     // Opportunity to improve and gain marks!
//     export { addPhoto, GetPhotoSrc };





// section 1





    // function GetPhotoSrc(id) {
    //     console.log("getPhotoSrc", id);
      
    //     const photo = useLiveQuery(async () => {
    //       const photos = await db.photos.where("id").equals(id).toArray();
    //       return photos[0];
    //     }, [id]);
      
    //     if (photo) {
    //       console.log("Photo found:", photo);
    //       return photo.imgSrc;
    //     } else {
    //       console.log("Photo not found for id:", id);
    //       return null;
    //     }
    //   }
    //   export { addPhoto, GetPhotoSrc };




    //   // section 2

//   import Dexie from "dexie";
//   import { useLiveQuery } from "dexie-react-hooks";

// export const db = new Dexie("todo-photos");

// db.version(1).stores({
//   photos: "id",
// });

// export async function addPhoto(id, imgSrc) {
//   console.log("addPhoto", imgSrc.length, id);
//   try {
//     const i = await db.photos.add({
//       id: id,
//       imgSrc: imgSrc,
//     });
//     console.log(`Photo ${imgSrc.length} bytes successfully added. Got id ${i}`);
//   } catch (error) {
//     console.log(`Failed to add photo: ${error}`);
//   }
// }

// export function GetPhotoSrc(id) {
//   console.log("getPhotoSrc", id);
//   const photo = useLiveQuery(() => db.photos.get(id), [id]);
//   console.log("Photo:", photo);
//   return photo ? photo.imgSrc : null;
// }


// db.js
// W07 - This file is all new
import Dexie from "dexie";
import { useLiveQuery } from "dexie-react-hooks";

export const db = new Dexie("todo-photos");

db.version(1).stores({
  photos: "id", // Primary key, don't index photos
});

async function addPhoto(id, imgSrc) {
  console.log("addPhoto", imgSrc.length, id);
  try {
    // Add the new photo with id used as key for todo array in localStoarge
    // to avoid having a second pk for one todo item
    const i = await db.photos.add({
      id: id,
      imgSrc: imgSrc,
    });
    console.log(`Photo ${imgSrc.length} bytes successfully added. Got id ${i}`);
  } catch (error) {
    console.log(`Failed to add photo: ${error}`);
  }
  return (
    <>
      <p>
        {imgSrc.length} &nbsp; | &nbsp; {id}
      </p>
    </>
  );
}

function GetPhotoSrc(id) {
  console.log("getPhotoSrc", id);
  const img = useLiveQuery(() => db.photos.where("id").equals(id).toArray());
  console.table(img);
  if (Array.isArray(img)) return img[0].imgSrc;
}

export { addPhoto, GetPhotoSrc };
