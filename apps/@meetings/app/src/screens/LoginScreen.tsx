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

import React from "react";
import { Alert, Button, Text, View } from "react-native";
import { useAuth0 } from "react-native-auth0";
import { SafeAreaProvider } from "react-native-safe-area-context";

const LoginScreen = () => {
  const { authorize, clearSession, user, getCredentials, isLoading } =
    useAuth0();

  const onLogin = async () => {
    const audience = process.env["EXPO_PUBLIC_AUTH0_AUDIENCE"];
    await authorize({ audience });
    const credentials = await getCredentials();
    Alert.alert("AccessToken: " + credentials?.accessToken);
  };

  const onLogout = async () => {
    await clearSession();
  };

  const loggedIn = user !== undefined && user !== null;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider className="flex-1 items-center justify-center">
      <Text className="mb-5 text-xl">Auth0 Login</Text>
      {user && <Text>You are logged in as {user.name}</Text>}
      {!user && <Text>You are not logged in</Text>}
      <Button
        onPress={loggedIn ? onLogout : onLogin}
        title={loggedIn ? "Log Out" : "Log In"}
      />
    </SafeAreaProvider>
  );
};

export default LoginScreen;
