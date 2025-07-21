import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Check, Mail, Package, RefreshCw, List, FileText, Users, Play } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
export default function Home() {
  return (
    <div className="min-h-screen bg-white con" >
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl">
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                Automate Your eCommerce Support With AI
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                AI that replies to your customers, manages your orders, and saves hours of work
              </p>
              <div className="flex space-x-4">
                <Link href="/auth">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium rounded-lg">
                    Start Free Trial
                  </Button>
                </Link>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-base font-medium rounded-lg flex items-center">
                  <span className="mr-2">Watch 5-Min Demo</span>
                  <Play className="w-6 h-6" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl p-8 shadow-xl">
                <img 
                  src="/dashboard-mockup.svg" 
                  alt="Dashboard mockup" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Get started in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-lg font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Connect Your Store</h3>
              <p className="text-gray-700 text-sm leading-relaxed">Link your Shopify/WooCommerce store and email system in minutes</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-lg font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">AI Learns Your Business</h3>
              <p className="text-gray-700 text-sm leading-relaxed">Our AI understands your tone, products, and order management flow</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-lg font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Autopilot Responds</h3>
              <p className="text-gray-700 text-sm leading-relaxed">AI handles support emails automatically in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600">Everything you need to automate customer support</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <Mail className="w-12 h-12 text-blue-600 mx-auto mb-6" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Auto-Email Replies</h3>
              <p className="text-gray-700 text-sm leading-relaxed">Instant responses to customer inquiries with personalized messaging</p>
            </div>
            <div className="text-center">
              <Package className="w-12 h-12 text-blue-600 mx-auto mb-6" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Order Tracking Updates</h3>
              <p className="text-gray-700 text-sm leading-relaxed">Automatic status updates and shipping notifications</p>
            </div>
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-6" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Refund/Return Handling</h3>
              <p className="text-gray-700 text-sm leading-relaxed">Streamlined return process management and approvals</p>
            </div>
            <div className="text-center">
              <List className="w-12 h-12 text-blue-600 mx-auto mb-6" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Product Listing Generation</h3>
              <p className="text-gray-700 text-sm leading-relaxed">AI-powered product descriptions and listings</p>
            </div>
            <div className="text-center">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-6" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Smart Templates</h3>
              <p className="text-gray-700 text-sm leading-relaxed">Pre-built templates that adapt to your brand voice</p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-6" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Human Approval Optional</h3>
              <p className="text-gray-700 text-sm leading-relaxed">Review and approve responses before sending if needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-lg text-gray-600">Choose the plan that fits your business</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {/* Free Trial */}
            <Card className="relative border border-gray-200 rounded-xl">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">Free Trial</CardTitle>
                <div className="text-3xl font-bold text-gray-900">
                  $0<span className="text-lg font-normal text-gray-500">/7 days</span>
                </div>
              </CardHeader>
              <CardContent className="px-6">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    50 emails/month
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    Basic templates
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    Email support
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="px-6 pb-6">
                <Link href="/auth" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Start Trial
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Basic Plan */}
            <Card className="relative border border-gray-200 rounded-xl">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">Basic Plan</CardTitle>
                <div className="text-3xl font-bold text-gray-900">
                  $29<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent className="px-6">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    300 emails/month
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    All templates
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    Order tracking
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="px-6 pb-6">
                <Link href="/auth" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-2 border-blue-500 rounded-xl shadow-lg">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-orange-500 hover:bg-orange-500 text-white px-3 py-1 text-xs font-medium">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">Pro Plan</CardTitle>
                <div className="text-3xl font-bold text-gray-900">
                  $79<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent className="px-6">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    2,000 emails/month
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    Advanced AI features
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    Priority support
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="px-6 pb-6">
                <Link href="/auth" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative border border-gray-200 rounded-xl">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">Enterprise</CardTitle>
                <div className="text-3xl font-bold text-gray-900">Custom</div>
              </CardHeader>
              <CardContent className="px-6">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    Unlimited emails
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    Custom integrations
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    Dedicated support
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="px-6 pb-6">
                <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg">
                  Contact Sales
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-gray-200 rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Sarah Johnson</div>
                    <div className="text-sm text-gray-500">Store Owner</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"AutoSupport saved me 30+ hours per week. The AI responses are so natural, customers can't tell the difference!"</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Mike Chen</div>
                    <div className="text-sm text-gray-500">eCommerce Manager</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"Our response time went from hours to minutes. Customer satisfaction has never been higher!"</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Emma Davis</div>
                    <div className="text-sm text-gray-500">Business Owner</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"The setup was incredibly easy. Within 30 minutes, we were automating our entire support workflow!"</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-xl text-blue-100 mb-8">Get notified about new features and updates</p>
          <div className="flex max-w-md mx-auto gap-2">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 bg-white border-white"
            />
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6">
              Notify Me
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer/>
    </div>
  )
}
