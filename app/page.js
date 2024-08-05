'use client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { firestore, storage } from '@/firebase';
import { Box, Modal, Typography, Stack, TextField, Button, Card, CardContent, CardActions, IconButton, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { collection, deleteDoc, doc, getDocs, getDoc, query, setDoc } from 'firebase/firestore';
import { uploadString, ref, getDownloadURL } from 'firebase/storage';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import Webcam from 'react-webcam';

const colors = {
  primary: '#00796b',
  secondary: '#004d40',
  background: '#e0f2f1',
  cardBackground: '#ffffff',
  textPrimary: '#004d40',
  textSecondary: '#00796b',
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [image, setImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantityFilter, setQuantityFilter] = useState('All');
  const [uploading, setUploading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [originalName, setOriginalName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(true);
  const inputFileRef = useRef(null);
  const webcamRef = useRef(null);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (item, imageUrl = '') => {
    if (!item) {
      console.error('Item ID cannot be empty');
      return;
    }
  
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1, imageUrl }, { merge: true });
    } else {
      await setDoc(docRef, { quantity: 1, imageUrl });
    }
    await updateInventory();
  };
  
  const updateItem = async (item, imageUrl = '') => {
    const docRef = doc(collection(firestore, 'inventory'), item);
  
    const updateData = imageUrl ? { imageUrl } : {};
  
    await setDoc(docRef, updateData, { merge: true });
    await updateInventory();
  };  

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity > 1) {
        await setDoc(docRef, { quantity: quantity - 1 }, { merge: true });
      } else {
        await deleteDoc(docRef);
      }
    }
    await updateInventory();
  };

  const handleOpen = (name) => {
    setOriginalName(name);
    setCurrentItem(name);
    setIsAddingNew(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentItem(null);
    setItemName('');
    setImage(null);
    setIsAddingNew(true);
    setShowWebcam(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleQuantityFilter = (e) => {
    setQuantityFilter(e.target.value);
  };

  const handleImageUpload = (event) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const uploadImage = async () => {
    setUploading(true);
  
    let downloadURL = '';
  
    if (image) {
      const storageRef = ref(storage, `images/${currentItem || itemName}`);
      await uploadString(storageRef, image, 'data_url');
      downloadURL = await getDownloadURL(storageRef);
    }
  
    setUploading(false);
  
    if (isAddingNew) {
      await addItem(itemName, downloadURL);
    } else {
      if (image) {
        await updateItem(itemName, downloadURL);
      } else {
        await updateItemName(currentItem, itemName);
      }
    }
  
    handleClose();
  };
  
  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
    setShowWebcam(false);
  };

  const filteredInventory = inventory
    .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((item) => (quantityFilter === 'All' ? true : item.quantity >= parseInt(quantityFilter)));

  useEffect(() => {
    updateInventory();
  }, []);
  
  const updateItemName = async (currentItem, newItemName) => {
    const itemDoc = doc(collection(firestore, 'inventory'), currentItem);
  
    // Check if the item with the new name already exists
    const newItemDoc = doc(collection(firestore, 'inventory'), newItemName);
    const newItemSnap = await getDoc(newItemDoc);
  
    if (newItemSnap.exists()) {
      console.error('Item with the new name already exists');
      return;
    }
  
    const itemSnap = await getDoc(itemDoc);
  
    if (itemSnap.exists()) {
      const itemData = itemSnap.data();
      await setDoc(newItemDoc, itemData);
      await deleteDoc(itemDoc);
      await updateInventory();
    } else {
      console.error('Item does not exist');
    }
  };
  
  return (
    <Box
      sx={{
        backgroundColor: colors.background,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 4,
      }}
    >
      <Typography variant="h3" color={colors.textPrimary} gutterBottom>
        Pantry Tracker
      </Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" maxWidth={600} mb={3}>
        <TextField
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search items"
          InputProps={{
            startAdornment: <SearchIcon />,
          }}
        />
        <FormControl variant="outlined" sx={{ minWidth: 120, ml: 2 }}>
          <InputLabel>Quantity</InputLabel>
          <Select value={quantityFilter} onChange={handleQuantityFilter} label="Quantity">
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="1">1+</MenuItem>
            <MenuItem value="5">5+</MenuItem>
            <MenuItem value="10">10+</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)} sx={{ ml: 2 }}>
          Add Item
        </Button>
      </Box>
      <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2}>
        {filteredInventory.map(({ name, quantity, imageUrl }) => (
          <Card key={name} sx={{ width: 250, backgroundColor: colors.cardBackground }}>
            <CardContent sx={{ textAlign: 'center' }}>
              {imageUrl ? (
                <Box display="flex" justifyContent="center" alignItems="center">
                  <Image src={imageUrl} alt={name} width={250} height={150} />
                </Box>
              ) : (
                <Typography>No Image</Typography>
              )}
              <Typography variant="h5" color={colors.textPrimary}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant="h6" color={colors.textSecondary}>
                Quantity: {quantity}
              </Typography>
            </CardContent>
            <CardActions>
              <IconButton onClick={() => addItem(name)} sx={{ color: colors.primary }}>
                <AddIcon />
              </IconButton>
              <IconButton onClick={() => removeItem(name)} sx={{ color: colors.secondary }}>
                <RemoveIcon />
              </IconButton>
              <Button variant="outlined" color="primary" onClick={() => handleOpen(name)}>
                Edit
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%,-50%)"
          width={400}
          bgcolor={colors.cardBackground}
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{ transform: 'translate(-50%,-50%)' }}
        >
          <Typography variant="h6" color={colors.textPrimary}>
            {isAddingNew ? 'Add Item' : 'Update'}
          </Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              label="Item Name"
            />
            <input
              type="file"
              accept="image/*"
              ref={inputFileRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <Button variant="contained" onClick={() => inputFileRef.current && inputFileRef.current.click()}>
              {isAddingNew ? 'Upload Image' : 'Change Image'}
            </Button>
            <Button variant="contained" onClick={uploadImage} disabled={uploading}>
              {isAddingNew ? 'Add' : 'Update'}
            </Button>
            <Button variant="contained" onClick={() => setShowWebcam(true)}>
              Use Camera
            </Button>
          </Stack>
          {image && (
            <Box display="flex" justifyContent="center" alignItems="center">
              <img src={image} alt="Item Image" width={100} height={100} style={{ display: 'block', margin: 'auto' }} />
            </Box>
          )}
          {showWebcam && (
            <>
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
              <Button variant="contained" onClick={captureImage}>
                Capture Image
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
