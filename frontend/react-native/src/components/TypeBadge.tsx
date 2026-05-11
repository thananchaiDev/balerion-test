import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { OrderType } from '../domain/types';
import { theme } from '../theme';

export function TypeBadge({ type }: { type: OrderType }) {
  const meta = theme.orderTypes[type];

  return (
    <View style={[styles.badge, { backgroundColor: meta.color }]}>
      <Text style={styles.text}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {
    color: theme.colors.text.inverse,
    fontSize: 11,
    fontWeight: '600',
  },
});
