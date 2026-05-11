import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import type { Order, Allocation } from '../domain/types';
import { TypeBadge } from './TypeBadge';
import { theme } from '../theme';

interface Props {
  order: Order;
  allocation?: Allocation;
  onChange: (
    subOrderId: string,
    value: number,
  ) => { ok: true } | { ok: false; reason: string };
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function DetailCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailCell}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export const OrderRow = React.memo(function OrderRow({
  order,
  allocation,
  onChange,
}: Props) {
  const allocated = allocation?.allocated ?? 0;
  const allocatedText = String(allocated);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);
  const [draftText, setDraftText] = useState(allocatedText);
  const [modalError, setModalError] = useState<string | undefined>();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (!modalOpen) setDraftText(allocatedText);
  }, [allocatedText, modalOpen]);

  useEffect(() => {
    if (modalOpen) {
      setModalMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
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
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 210,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setModalMounted(false);
    });
  }, [backdropOpacity, modalOpen, sheetTranslateY]);

  const draftNumber = Number(draftText);
  const canSave = draftText.trim() !== '' && !Number.isNaN(draftNumber);
  const hasInputError = (!canSave && draftText.trim() !== '') || Boolean(modalError);

  const openAllocateModal = () => {
    setDraftText(allocatedText);
    setModalError(undefined);
    setModalOpen(true);
  };

  const closeAllocateModal = () => {
    setDraftText(allocatedText);
    setModalError(undefined);
    setModalOpen(false);
  };

  const saveAllocation = () => {
    if (!canSave) return;
    const outcome = onChange(order.subOrderId, draftNumber);
    if (!outcome.ok) {
      setModalError(outcome.reason);
      return;
    }
    setModalError(undefined);
    setModalOpen(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.itemId}>{order.itemId}</Text>
          <Text style={styles.subOrder} numberOfLines={1}>
            {order.subOrderId}
          </Text>
        </View>
        <TypeBadge type={order.type} />
      </View>

      <View style={styles.metricGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Request</Text>
          <Text style={styles.metricValue}>{formatNumber(order.request)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Allocated</Text>
          <Text style={styles.metricValue}>{formatNumber(allocated)}</Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <DetailCell label="Order" value={order.orderId} />
        <DetailCell label="Customer" value={order.customerId} />
        <DetailCell label="Warehouse" value={order.warehouseId} />
        <DetailCell label="Supplier" value={order.supplierId} />
        <DetailCell label="Create" value={order.createDate} />
      </View>

      <View
        style={{
          height: 45,
          marginTop: 14,
          borderRadius: 8,
          backgroundColor: theme.colors.action.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Pressable
          onPress={openAllocateModal}
          style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: theme.colors.text.inverse,
              fontSize: 13,
              fontWeight: '800',
            }}
          >
            Edit
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={modalMounted}
        animationType="none"
        transparent
        onRequestClose={closeAllocateModal}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Animated.View
            style={[styles.modalBackdrop, { opacity: backdropOpacity }]}
          >
            <Pressable
              style={styles.modalBackdropPressable}
              onPress={closeAllocateModal}
            />
          </Animated.View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : undefined}
            keyboardVerticalOffset={0}
            pointerEvents="box-none"
            style={styles.modalKeyboardAvoiding}
            contentContainerStyle={styles.modalKeyboardContent}
          >
            <Animated.View
              style={[
                styles.modalSheet,
                { transform: [{ translateY: sheetTranslateY }] },
              ]}
            >
              <View pointerEvents="none" style={styles.modalSheetExtension} />
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleBlock}>
                  <Text style={styles.modalTitle}>Edit allocation</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {order.subOrderId} · {order.itemId} · {order.customerId}
                  </Text>
                </View>
                <Pressable onPress={closeAllocateModal} hitSlop={12}>
                  <X size={22} color={theme.colors.text.primary} />
                </Pressable>
              </View>

              <Text style={styles.modalFieldLabel}>
                New Allocated (0 – {formatNumber(order.request)})
              </Text>
              <View
                style={[
                  styles.modalInputWrap,
                  hasInputError ? styles.modalInputWrapInvalid : null,
                ]}
              >
                <TextInput
                  style={styles.modalInput}
                  keyboardType="decimal-pad"
                  value={draftText}
                  autoFocus
                  selectTextOnFocus
                  onChangeText={setDraftText}
                  placeholder="0"
                  placeholderTextColor={theme.colors.text.placeholder}
                />
              </View>

              {!canSave && draftText.trim() !== '' ? (
                <Text style={styles.modalError}>Enter a valid number.</Text>
              ) : null}
              {modalError ? (
                <Text style={styles.modalError}>{modalError}</Text>
              ) : null}

              <View style={styles.modalActions}>
                <Pressable
                  onPress={closeAllocateModal}
                  style={[styles.modalActionButton, styles.cancelButton]}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={saveAllocation}
                  disabled={!canSave}
                  style={[
                    styles.modalActionButton,
                    styles.saveButton,
                    !canSave ? styles.saveButtonDisabled : null,
                  ]}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.default,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  itemId: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  subOrder: {
    color: theme.colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  metricBox: {
    flex: 1,
    borderColor: theme.colors.border.default,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: theme.colors.background.muted,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  metricLabel: {
    color: theme.colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 5,
  },
  editButton: {
    height: 45,
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonPressed: {
    opacity: 0.85,
  },
  editButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 13,
    fontWeight: '800',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
    marginTop: 14,
  },
  detailCell: {
    width: '48%',
    minWidth: 0,
  },
  detailLabel: {
    color: theme.colors.text.placeholder,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  error: {
    color: theme.colors.text.danger,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.modal.backdrop,
  },
  modalBackdropPressable: {
    flex: 1,
  },
  modalKeyboardAvoiding: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalKeyboardContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.background.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  modalSheetExtension: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -SCREEN_HEIGHT,
    height: SCREEN_HEIGHT,
    backgroundColor: theme.colors.background.surface,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.border.strong,
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  modalTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: theme.colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  modalFieldLabel: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  modalInputWrap: {
    height: 54,
    borderColor: theme.colors.border.focus,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.palette.blue[50],
    paddingHorizontal: 12,
  },
  modalInputWrapInvalid: {
    borderColor: theme.colors.border.danger,
    backgroundColor: theme.colors.palette.red[50],
  },
  modalInput: {
    flex: 1,
    height: 52,
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: '800',
    paddingVertical: 0,
  },
  modalError: {
    color: theme.colors.text.danger,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalActionButton: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cancelButton: {
    borderColor: theme.colors.border.strong,
    borderWidth: 1,
  },
  cancelButtonText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.action.primary,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '800',
  },
});
