import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TextInputProps,
} from "react-native";
import { COLORS } from "../constants/colors";

interface Props extends TextInputProps {
  label: string;
}

export const CustomInput: React.FC<Props> = ({ label, ...props }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor="#aaa" {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 15 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
  },
});
