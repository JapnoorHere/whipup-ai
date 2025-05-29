export const formatTimeFromSeconds = (seconds) => {
  const totalSeconds = parseInt(seconds) || 0;
  
  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  } else if (totalSeconds < 3600) {
    const minutes = Math.ceil(totalSeconds / 60);
    return `${minutes} min`;
  } else {
    const hours = Math.floor(totalSeconds / 3600);
    const remainingMinutes = Math.ceil((totalSeconds % 3600) / 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
};

export const formatTimeToMinutes = (seconds) => {
  return Math.ceil((parseInt(seconds) || 0) / 60);
};

export const formatTimeToHoursMinutes = (seconds) => {
  const totalSeconds = parseInt(seconds) || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.ceil((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
};
