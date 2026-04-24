import UIKit

class ImageLoader {

    static let shared = ImageLoader()

    private let cache = NSCache<NSString, UIImage>()

    private init() {
        cache.countLimit = 100
        cache.totalCostLimit = 50 * 1024 * 1024
    }

    func loadImage(from data: Data?, completion: @escaping (UIImage?) -> Void) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else {
                DispatchQueue.main.async { completion(nil) }
                return
            }
            guard let data = data else {
                DispatchQueue.main.async { completion(nil) }
                return
            }
            let key = String(data.hashValue) as NSString
            if let cachedImage = self.cache.object(forKey: key) {
                DispatchQueue.main.async { completion(cachedImage) }
                return
            }
            let image = UIImage(data: data)
            if let image = image {
                let imageData = UIImageJPEGRepresentation(image, 1.0)
                let cost = imageData?.count ?? 0
                self.cache.setObject(image, forKey: key, cost: cost)
            }
            DispatchQueue.main.async { completion(image) }
        }
    }

    func clearCache() {
        cache.removeAllObjects()
    }
}
