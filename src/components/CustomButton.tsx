import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TouchableOpacityProps,
} from "react-native";
import { COLORS } from "../constants/colors";

interface Props extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
}

export const CustomButton: React.FC<Props> = ({
  title,
  isLoading,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, props.disabled && styles.disabled]}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  disabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
  },
  text: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
