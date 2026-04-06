import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Updates from 'expo-updates';

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log error details without exposing stack trace to the user
    console.error('[ErrorBoundary] Caught error:', error.message);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  async handleRestart() {
    try {
      await Updates.reloadAsync();
    } catch {
      // reloadAsync may fail in development — reset state as fallback
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            An unexpected error occurred. Tap below to restart the app.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.handleRestart()}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Restart App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F1729',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#5A6A8A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#4361EE',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
