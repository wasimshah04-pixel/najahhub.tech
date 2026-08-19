import { useTheme } from '../../context/ThemeContext';
import './WhatsAppButton.css';

export default function WhatsAppButton() {
  const { getSetting } = useTheme();
  const number = getSetting('general', 'whatsapp_number', '');

  if (!number) return null;

  const cleanNumber = number.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${cleanNumber}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-btn"
      aria-label="Chat on WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="28" height="28" fill="#FFFFFF">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.054 9.378L1.054 31.25l6.112-1.978A15.907 15.907 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.34 22.608c-.39 1.096-1.932 2.006-3.158 2.27-.836.18-1.93.322-5.622-1.206-4.724-1.956-7.762-6.77-7.994-7.082-.224-.312-1.872-2.496-1.872-4.762 0-2.264 1.188-3.376 1.61-3.842.422-.466.92-.582 1.224-.582.304 0 .606.002.87.016.28.012.654-.106.892.68.238.784.81 2.716.88 2.916.07.2.116.434.024.7-.09.266-.134.43-.266.662-.132.232-.28.518-.398.694-.132.196-.27.408-.116.632.154.224.684 1.13 1.47 1.83.996.894 1.864 1.19 2.176 1.308.232.088.492.066.662-.14.216-.264.486-.686.76-1.11.196-.304.444-.34.752-.232.31.106 1.972.93 2.312 1.1.34.17.566.256.648.398.082.142.082.82-.308 1.916z" />
      </svg>
    </a>
  );
}
