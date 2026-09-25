import { Alert, Platform } from 'react-native';

export const DialogUtils = {
  /**
   * Muestra un diálogo de confirmación que funciona de forma garantizada tanto en Web como en iOS y Android.
   */
  confirm(title: string, message: string, onConfirm: () => void | Promise<void>) {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true;
      if (confirmed) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: () => {
            onConfirm();
          },
        },
      ]);
    }
  },

  /**
   * Muestra un mensaje informativo compatible con Web y Móvil.
   */
  alert(title: string, message?: string) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.alert(message ? `${title}\n\n${message}` : title);
      }
    } else {
      Alert.alert(title, message);
    }
  },

  /**
   * Solicita un texto al usuario compatible con Web y Móvil.
   */
  prompt(title: string, defaultValue: string = '', onSubmit: (value: string) => void) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const val = window.prompt(title, defaultValue);
        if (val !== null && val.trim()) {
          onSubmit(val.trim());
        }
      }
    } else {
      // En React Native nativo
      Alert.prompt?.(title, undefined, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Guardar', onPress: (val?: string) => val && onSubmit(val.trim()) },
      ], 'plain-text', defaultValue);
    }
  },
};
