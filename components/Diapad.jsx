import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity,TextInput  } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';

const DialPad = () => {
    const [inputValue, setInputValue] = useState('');

  const handleNumberPress = (number) => {
    // 处理数字按钮点击事件
    console.log(`Pressed number: ${number}`);
    setInputValue(prevValue => prevValue + number);
  }


  const handleVideoCall = () => {
 
  }

  const handleAudioCall = () => {
  }

  const handleDel=()=>{
    setInputValue(prevValue => prevValue.slice(0, -1));
  }
  

  return (
    <View style={styles.container}>
     <TextInput
        style={styles.input}
        value={inputValue}
        onChangeText={setInputValue}
        placeholder="请输入"
        
      />
         <TouchableOpacity style={styles.deleteButton} onPress={handleDel}>
        <Text style={styles.deleteButtonText}>X</Text>
      </TouchableOpacity>
      <View style={styles.dialPad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9,'*',0,'#'].map((number) => (
          <TouchableOpacity
            key={number}
            style={styles.numberButton}
            onPress={() => handleNumberPress(number)}
          >
            <Text style={styles.numberText}>{number}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.callButton} onPress={handleAudioCall}>
          <Text style={styles.callButtonText}>Audio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.datePickerButton} onPress={handleVideoCall}>
          <Text style={styles.datePickerButtonText}>Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input:{
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '90%',
    fontSize: 18,

  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 30,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dialPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '90%',
  },
  numberButton: {
    width: '25%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    margin: '2%',
    borderRadius: 50,
  },
  numberText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 20,
    marginBottom: 20,

  },
  callButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
  },
  callButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
  },
  datePickerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DialPad;
