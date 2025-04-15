import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import blogCompanyLogo from "@assets/blog company.png";

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <img src={blogCompanyLogo} alt="Blog Company" className="h-12 w-auto mb-6" />
            <p className="text-neutral-400 text-sm mb-6">
              Share your knowledge and experiences with our community. We provide the platform, you provide the insights.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Explore</h3>
            <ul className="space-y-2">
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Home</a></Link></li>
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Articles</a></Link></li>
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Authors</a></Link></li>
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Tags</a></Link></li>
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">FAQ</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">About Us</a></Link></li>
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Careers</a></Link></li>
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Privacy Policy</a></Link></li>
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Terms of Service</a></Link></li>
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Contact Us</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Help Center</a></Link></li>
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Writer's Guidelines</a></Link></li>
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Community Guidelines</a></Link></li>
              <li><Link href="/"><a className="text-neutral-400 hover:text-white">Report an Issue</a></Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400 text-sm">&copy; 2023 Blog Company. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <Link href="/"><a className="text-neutral-400 hover:text-white text-sm mx-3">Privacy Policy</a></Link>
            <Link href="/"><a className="text-neutral-400 hover:text-white text-sm mx-3">Terms of Service</a></Link>
            <Link href="/"><a className="text-neutral-400 hover:text-white text-sm mx-3">Cookie Policy</a></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
