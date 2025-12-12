// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface SnackbarContextType {
  showSnackbar: (text: string, duration?: number) => void;
  isShowing: boolean;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }
  return context;
};

type Props = {
  children: React.ReactNode;
};

export const SnackbarProvider = ({ children }: Props) => {
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideSnackbar = useCallback(() => {
    opacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => {
      setIsShowing(false);
      setIsVisible(false);
      setMessage("");
    }, 300);
  }, [opacity]);

  const showSnackbar = useCallback(
    (text: string, duration = 3000) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (isShowing) {
        opacity.value = withTiming(0, { duration: 200 });
        setTimeout(() => {
          setMessage(text);
          setIsVisible(true);
          setIsShowing(true);
          opacity.value = withTiming(1, { duration: 300 });
        }, 200);
      } else {
        setMessage(text);
        setIsVisible(true);
        setIsShowing(true);
        opacity.value = withTiming(1, { duration: 300 });
      }

      timeoutRef.current = setTimeout(() => {
        hideSnackbar();
      }, duration);
    },
    [isShowing, hideSnackbar, opacity],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <SnackbarContext.Provider value={{ showSnackbar, isShowing }}>
      {children}
      {isVisible && (
        <Animated.View
          style={animatedStyle}
          className="absolute inset-x-16 top-32 z-50"
        >
          <View className="rounded-xl bg-[#1D2424] px-9 py-4 shadow-lg">
            <Text className="text-center font-inter text-sm font-semibold leading-[16px] text-white">
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
};
