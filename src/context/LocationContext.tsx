import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Governorate,
  District,
  UserLocation,
  IRAQ_GOVERNORATES,
  DEFAULT_USER_LOCATION,
  findNearestGovernorate,
  getGovernorate,
} from '../data/iraqLocations';

interface LocationContextType {
  currentLocation: UserLocation;
  governorates: Governorate[];
  selectedGovernorate: Governorate;
  availableDistricts: District[];
  isDetectingGPS: boolean;
  gpsStatusMessage: string | null;
  clearGpsStatusMessage: () => void;
  isLocationModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  detectGPSLocation: (manualTrigger?: boolean, onSuccess?: (loc: UserLocation) => void) => void;
  changeLocation: (governorateId: string, districtId?: string) => void;
  setDistrict: (districtId: string, districtName?: string) => void;
  setAllDistrictsForGovernorate: (governorateId: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<UserLocation>(() => {
    const saved = localStorage.getItem('iraq_directory_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const gov = getGovernorate(parsed.governorateId);
        if (gov) {
          return parsed;
        }
      } catch (e) {
        // Fallback to default
      }
    }
    return DEFAULT_USER_LOCATION;
  });

  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('iraq_directory_location', JSON.stringify(currentLocation));
  }, [currentLocation]);

  // Current Governorate object
  const selectedGovernorate =
    getGovernorate(currentLocation.governorateId) || IRAQ_GOVERNORATES[0];

  const availableDistricts = selectedGovernorate.districts;

  // GPS auto-detection handler with high-accuracy and cellular fallback
  const detectGPSLocation = useCallback((manualTrigger: boolean = false, onSuccess?: (loc: UserLocation) => void) => {
    if (!('geolocation' in navigator)) {
      if (manualTrigger) {
        setGpsStatusMessage('تحديد الموقع عبر GPS غير مدعوم في متصفحك أو جهازك.');
      }
      return;
    }

    setIsDetectingGPS(true);
    setGpsStatusMessage('جاري الاتصال بالأقمار الصناعية لتحديد مدينتك بدقة...');

    const runGeolocation = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const result = findNearestGovernorate(latitude, longitude);

          const newLocation: UserLocation = {
            governorateId: result.governorate.id,
            districtId: result.district.id,
            governorateName: result.governorate.name,
            districtName: result.district.name,
            isAutoDetected: true,
          };

          setCurrentLocation(newLocation);
          setIsDetectingGPS(false);
          setGpsStatusMessage(
            `تم تحديد موقعك: ${result.district.name} / ${result.governorate.name}`
          );

          if (onSuccess) {
            onSuccess(newLocation);
          }

          // Clear status after 5 seconds
          setTimeout(() => setGpsStatusMessage(null), 5000);
        },
        (error) => {
          // If high accuracy times out, retry once with cellular/Wi-Fi positioning
          if (highAccuracy && error.code === error.TIMEOUT) {
            runGeolocation(false);
            return;
          }

          setIsDetectingGPS(false);
          let errorMsg = 'تعذر تحديد موقعك عبر GPS.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'تم رفض إذن الوصول للموقع. يمكنك اختيار مدينتك يدوياً في أي وقت.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'خدمة GPS غير مفعلة. يرجى تفعيل الموقع أو اختيار مدينتك يدوياً.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'استغرقت إشارة GPS وقتاً طويلاً. تأكد من اتصال الإنترنت أو اختر مدينتك يدوياً.';
          }

          setGpsStatusMessage(errorMsg);
          setTimeout(() => setGpsStatusMessage(null), 7000);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 8000 : 12000,
          maximumAge: 30000,
        }
      );
    };

    runGeolocation(true);
  }, []);

  // Automatic silent GPS probe on first mount if not explicitly set before
  useEffect(() => {
    const hasDetectedBefore = localStorage.getItem('iraq_has_attempted_gps');
    if (!hasDetectedBefore) {
      localStorage.setItem('iraq_has_attempted_gps', 'true');
      detectGPSLocation(false);
    }
  }, [detectGPSLocation]);

  const changeLocation = (governorateId: string, districtId?: string) => {
    const gov = getGovernorate(governorateId);
    if (!gov) return;

    let targetDistrict = gov.districts[0];
    if (districtId) {
      const found = gov.districts.find((d) => d.id === districtId);
      if (found) targetDistrict = found;
    } else {
      const centerDist = gov.districts.find((d) => d.isCenter);
      if (centerDist) targetDistrict = centerDist;
    }

    const newLocation: UserLocation = {
      governorateId: gov.id,
      districtId: targetDistrict.id,
      governorateName: gov.name,
      districtName: targetDistrict.name,
      isAutoDetected: false,
    };

    setCurrentLocation(newLocation);
    setIsLocationModalOpen(false);
    setGpsStatusMessage(null);
  };

  const setAllDistrictsForGovernorate = (governorateId: string) => {
    const gov = getGovernorate(governorateId);
    if (!gov) return;

    setCurrentLocation((prev) => ({
      ...prev,
      governorateId: gov.id,
      governorateName: gov.name,
      districtId: 'all',
      districtName: 'جميع الأقضية',
      isAutoDetected: false,
    }));
    setIsLocationModalOpen(false);
  };

  const openLocationModal = () => setIsLocationModalOpen(true);
  const closeLocationModal = () => setIsLocationModalOpen(false);
  const clearGpsStatusMessage = useCallback(() => setGpsStatusMessage(null), []);

  const setDistrict = useCallback((districtId: string, _districtName?: string) => {
    changeLocation(currentLocation.governorateId, districtId);
  }, [changeLocation, currentLocation.governorateId]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        governorates: IRAQ_GOVERNORATES,
        selectedGovernorate,
        availableDistricts,
        isDetectingGPS,
        gpsStatusMessage,
        clearGpsStatusMessage,
        isLocationModalOpen,
        openLocationModal,
        closeLocationModal,
        detectGPSLocation,
        changeLocation,
        setDistrict,
        setAllDistrictsForGovernorate,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
