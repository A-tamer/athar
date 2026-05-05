const Footer = () => {
  return (
    <footer className="bg-olive-900 text-beige-200 py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <p className="text-base sm:text-lg mb-1 sm:mb-2">أثر © {new Date().getFullYear()}</p>
        <p className="text-xs sm:text-sm opacity-70 mb-2">جميع الحقوق محفوظة</p>
        <p className="text-xs sm:text-sm opacity-50">Made by Eng/ Ahmed Tamer</p>
        <p className="text-xs sm:text-sm opacity-50 mt-1">For business inquiries: ahmedtwafa@gmail.com</p>
      </div>
    </footer>
  )
}

export default Footer
