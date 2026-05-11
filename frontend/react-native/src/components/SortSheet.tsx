import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowDown, ArrowUp, Check, X } from 'lucide-react-native';

import { theme } from '../theme';
import type { OrderSortDirection } from '../utils/orderSort';

interface Props {
  open: boolean;
  onClose: () => void;
  value: OrderSortDirection;
  onChange: (next: OrderSortDirection) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const OPTIONS: Array<{
  value: OrderSortDirection;
  label: string;
  Icon: typeof ArrowUp;
}> = [
  { value: 'asc', label: 'Ascending', Icon: ArrowUp },
  { value: 'desc', label: 'Descending', Icon: ArrowDown },
];

export function SortSheet({ open, onClose, value, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [open, fade, slide]);

  const selectDirection = (next: OrderSortDirection) => {
    onChange(next);
    onClose();
  };

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={styles.backdropPressable} onPress={onClose} />
        </Animated.View>

        <View pointerEvents="box-none" style={styles.sheetAligner}>
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                transform: [{ translateY: slide }],
              },
            ]}
          >
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Sort</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={24} color={theme.colors.text.primary} />
              </Pressable>
            </View>

            <View style={styles.optionList}>
              {OPTIONS.map(({ value: optionValue, label, Icon }) => {
                const selected = optionValue === value;

                return (
                  <Pressable
                    key={optionValue}
                    onPress={() => selectDirection(optionValue)}
                    style={[
                      styles.option,
                      selected ? styles.optionSelected : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        selected ? styles.optionIconSelected : null,
                      ]}
                    >
                      <Icon
                        size={18}
                        color={
                          selected
                            ? theme.colors.text.inverse
                            : theme.colors.text.primary
                        }
                      />
                    </View>
                    <Text style={styles.optionText}>{label}</Text>
                    {selected ? (
                      <Check size={20} color={theme.colors.text.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors.modal.scrim,
  },
  backdropPressable: {
    flex: 1,
  },
  sheetAligner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.background.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleWrap: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.border.strong,
  },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  optionList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.surface,
  },
  optionSelected: {
    borderColor: theme.colors.border.strong,
    backgroundColor: theme.colors.background.subtle,
  },
  optionIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.background.subtle,
  },
  optionIconSelected: {
    backgroundColor: theme.colors.action.primary,
  },
  optionText: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
