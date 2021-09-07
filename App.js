import {StatusBar} from 'expo-status-bar';
import React, {useEffect, useState} from 'react';
import {Button, StyleSheet, Text, TouchableOpacity, View, Dimensions} from 'react-native';
import {BarCodeScanner} from 'expo-barcode-scanner';
import {Ionicons} from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import LottieView from 'lottie-react-native';

const lottieDir = FileSystem.cacheDirectory + 'lotties/';

async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(lottieDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(lottieDir, {intermediates: true});
  }
}

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [lottieFile, setLottieFile] = useState(null);

  useEffect(() => {
    (async () => {
      const {status} = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({type, data}) => {
    if (!/^https/.test(data)) {
      alert('Incorrect Data');
    } else {
      setFileUrl(data);
      setScanning(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (fileUrl) {
        try {
          await ensureDirExists();
          const filePath = `${lottieDir}${fileUrl.substring(fileUrl.lastIndexOf('/') + 1)}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(filePath);
          }

          await FileSystem.downloadAsync(fileUrl, filePath);

          const fileData = await FileSystem.readAsStringAsync(filePath);

          setLottieFile(JSON.parse(fileData));
        } catch (e) {
          console.log(e);
        }
      }
    })()
  }, [fileUrl]);

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark"/>
      {!scanning && <>
        <View style={{marginTop: 20, flex: 1}}>
          {lottieFile && <LottieView
            autoPlay
            loop
            style={{
              width: windowWidth,
              backgroundColor: '#fff',
            }}
            source={lottieFile}
          />}
        </View>

        <View style={{alignItems: 'center', marginTop: 20, marginBottom: 20}}>
          <TouchableOpacity style={{
            backgroundColor: '#3a93ff',
            width: 150,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            flexDirection: 'row'
          }} onPress={() => {
            setScanning(true);
            setLottieFile(null);
            setFileUrl(null);
          }}>
            <Ionicons name="qr-code-outline" size={18} color="white" style={{marginRight: 10}}/>
            <Text style={{color: 'white'}}>
              Scan QR
            </Text>
          </TouchableOpacity>
        </View>
      </>}

      {scanning && <View style={{flex: 1, backgroundColor: 'black'}}>
        <StatusBar style="light"/>
        <View style={[StyleSheet.absoluteFillObject, {top: 60, left: 30, zIndex: 100}]}>
          <TouchableOpacity onPress={() => {
            setScanning(false);
          }} style={{flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="chevron-back-outline" size={32} color="white"/>
            <Text style={{color: 'white'}}>
              Back
            </Text>
          </TouchableOpacity>

        </View>
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
