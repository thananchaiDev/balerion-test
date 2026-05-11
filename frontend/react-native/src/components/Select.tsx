import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { theme } from '../theme';

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: Option[];
  placeholder?: string;
  title?: string;
  onChange: (value: string) => void;
}

export function Select({ value, options, placeholder, title, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.trigger}
      >
        <Text
          style={[
            styles.triggerText,
            selected ? styles.triggerTextSelected : styles.triggerTextPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder ?? 'Select…'}
        </Text>
        <ChevronDown size={16} color={theme.colors.text.muted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.sheet}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {title ?? placeholder ?? 'Select'}
              </Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <X size={20} color={theme.colors.text.muted} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={styles.option}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active ? styles.optionTextActive : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {active ? (
                      <Check size={16} color={theme.colors.text.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.strong,
    borderRadius: 8,
    backgroundColor: theme.colors.background.surface,
  },
  triggerText: {
    flex: 1,
    marginRight: 8,
    fontSize: 14,
  },
  triggerTextSelected: {
    color: theme.colors.text.primary,
  },
  triggerTextPlaceholder: {
    color: theme.colors.text.placeholder,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: theme.colors.modal.scrim,
  },
  sheet: {
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: theme.colors.background.surface,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  sheetTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.subtle,
  },
  optionText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  optionTextActive: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
});
