import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  color?: string;
  bodyStyle?: string;
  mileage?: number;
  mileageUnit?: string;
  fuelType?: number;
  damageType?: number;
  carCondition?: number;
  transmission?: number;
  driveTrain?: number;
  titleType?: number;
  secondaryDamage?: number;
  hasKeys?: boolean;
  titleState?: string;
  price?: number;
  currency?: string;
  estimatedRetailValue?: number;
  locationId?: string;
  locationName?: string;
  locationAddress?: string;
  locationCity?: string;
  createdAt?: string;
  updatedAtUtc?: string;
  ownerId?: string;
  ownerUsername?: string;
  photoUrls?: string[];
  videoUrls?: string[];
}

interface ModalState {
  viewDetailsModal: {
    isOpen: boolean;
    vehicle: Vehicle | null;
  };
  editVehicleModal: {
    isOpen: boolean;
    vehicle: Vehicle | null;
  };
  deleteVehicleModal: {
    isOpen: boolean;
    vehicle: Vehicle | null;
  };
}

interface ModalContextType {
  modalState: ModalState;
  openViewDetailsModal: (vehicle: Vehicle) => void;
  closeViewDetailsModal: () => void;
  openEditVehicleModal: (vehicle: Vehicle) => void;
  closeEditVehicleModal: () => void;
  openDeleteVehicleModal: (vehicle: Vehicle) => void;
  closeDeleteVehicleModal: () => void;
  closeAllModals: () => void;
}

const initialModalState: ModalState = {
  viewDetailsModal: {
    isOpen: false,
    vehicle: null
  },
  editVehicleModal: {
    isOpen: false,
    vehicle: null
  },
  deleteVehicleModal: {
    isOpen: false,
    vehicle: null
  }
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState>(initialModalState);

  const openViewDetailsModal = (vehicle: Vehicle) => {
    setModalState(prev => ({
      ...prev,
      viewDetailsModal: {
        isOpen: true,
        vehicle
      }
    }));
  };

  const closeViewDetailsModal = () => {
    setModalState(prev => ({
      ...prev,
      viewDetailsModal: {
        isOpen: false,
        vehicle: null
      }
    }));
  };

  const openEditVehicleModal = (vehicle: Vehicle) => {
    setModalState(prev => ({
      ...prev,
      editVehicleModal: {
        isOpen: true,
        vehicle
      }
    }));
  };

  const closeEditVehicleModal = () => {
    setModalState(prev => ({
      ...prev,
      editVehicleModal: {
        isOpen: false,
        vehicle: null
      }
    }));
  };

  const openDeleteVehicleModal = (vehicle: Vehicle) => {
    setModalState(prev => ({
      ...prev,
      deleteVehicleModal: {
        isOpen: true,
        vehicle
      }
    }));
  };

  const closeDeleteVehicleModal = () => {
    setModalState(prev => ({
      ...prev,
      deleteVehicleModal: {
        isOpen: false,
        vehicle: null
      }
    }));
  };

  const closeAllModals = () => {
    setModalState(initialModalState);
  };

  const value: ModalContextType = {
    modalState,
    openViewDetailsModal,
    closeViewDetailsModal,
    openEditVehicleModal,
    closeEditVehicleModal,
    openDeleteVehicleModal,
    closeDeleteVehicleModal,
    closeAllModals
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

export default ModalProvider;
